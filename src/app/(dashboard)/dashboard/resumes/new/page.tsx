'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    FileText,
    Upload,
    Linkedin,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    CheckCircle2,
    Loader2,
    File,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useResumes } from '@/components/providers/resume-provider';
import { useLocale } from '@/components/providers/locale-provider';

type CreateMethod = 'scratch' | 'import' | 'linkedin' | null;

interface BasicInfo {
    title: string;
    targetRole: string;
    language: 'en' | 'ar';
    template: string;
}

const templates = [
    { id: 'prestige-executive', name: 'Prestige Executive', nameAr: 'المدير التنفيذي', description: 'Luxury corporate design with bold header', descriptionAr: 'تصميم فاخر للشركات مع رأس بارز' },
    { id: 'metropolitan-split', name: 'Metropolitan Split', nameAr: 'المتروبوليتان', description: 'Two-column layout with dark sidebar', descriptionAr: 'تخطيط عمودين مع شريط جانبي داكن' },
    { id: 'nordic-minimal', name: 'Nordic Minimal', nameAr: 'الشمالي المبسط', description: 'Ultra-clean Scandinavian design', descriptionAr: 'تصميم اسكندنافي فائق النظافة' },
    { id: 'classic-professional', name: 'Classic Professional', nameAr: 'الكلاسيكي المحترف', description: 'Traditional ATS-optimized layout', descriptionAr: 'تخطيط تقليدي محسّن للأنظمة' },
    { id: 'impact-modern', name: 'Impact Modern', nameAr: 'التأثير الحديث', description: 'Bold hero header with skill tags', descriptionAr: 'ترويسة جريئة مع علامات المهارات' },
];

export default function NewResumePage() {
    const router = useRouter();
    const { locale } = useLocale();
    const { createResume } = useResumes();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [method, setMethod] = useState<CreateMethod>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);

    const [basicInfo, setBasicInfo] = useState<BasicInfo>({
        title: '',
        targetRole: '',
        language: 'en',
        template: 'prestige-executive',
    });

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
            toast.error(locale === 'ar' ? 'يرجى رفع ملف PDF أو DOCX' : 'Please upload a PDF or DOCX file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error(locale === 'ar' ? 'الملف كبير جداً (الحد الأقصى 10 ميجابايت)' : 'File too large (max 10MB)');
            return;
        }

        setUploadedFile(file);
        setIsParsing(true);

        try {
            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Parse the resume
            const response = await fetch('/api/resume/parse', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to parse resume');
            }

            const data = await response.json();
            setParsedData(data);

            // Auto-fill title from parsed data
            if (data.name) {
                setBasicInfo(prev => ({
                    ...prev,
                    title: `${data.name}'s Resume`,
                }));
            }

            toast.success(locale === 'ar' ? 'تم تحليل السيرة الذاتية بنجاح!' : 'Resume parsed successfully!');
        } catch (error) {
            console.error('Parse error:', error);
            toast.error(locale === 'ar' ? 'فشل تحليل الملف - سيتم إنشاء سيرة فارغة' : 'Failed to parse file - will create empty resume');
            setParsedData(null);
        } finally {
            setIsParsing(false);
        }
    };

    // Remove uploaded file
    const removeFile = () => {
        setUploadedFile(null);
        setParsedData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle create resume
    const handleCreate = async () => {
        if (!basicInfo.title.trim()) {
            toast.error(locale === 'ar' ? 'يرجى إدخال عنوان السيرة الذاتية' : 'Please enter a resume title');
            return;
        }

        setIsLoading(true);
        try {
            const resumeId = await createResume({
                title: basicInfo.title,
                targetRole: basicInfo.targetRole || undefined,
                language: basicInfo.language,
                template: basicInfo.template,
            });

            const updateData: any = {
                title: basicInfo.title,
                targetRole: basicInfo.targetRole || undefined,
                template: basicInfo.template,
            };

            if (parsedData) {
                updateData.contact = {
                    fullName: parsedData.name || '',
                    email: parsedData.email || '',
                    phone: parsedData.phone || '',
                    location: parsedData.location || '',
                    linkedin: '',
                    website: '',
                };

                if (parsedData.summary) {
                    updateData.summary = { content: parsedData.summary };
                }

                if (parsedData.experience && Array.isArray(parsedData.experience)) {
                    updateData.experience = {
                        items: parsedData.experience.map((exp: any, index: number) => ({
                            id: `exp-${Date.now()}-${index}`,
                            company: exp.company || '',
                            position: exp.position || exp.title || '',
                            location: exp.location || '',
                            startDate: exp.startDate || '',
                            endDate: exp.endDate || '',
                            isCurrent: exp.endDate?.toLowerCase() === 'present' || exp.current || false,
                            description: exp.description || '',
                            bullets: (exp.achievements || exp.bullets || (exp.description ? [exp.description] : [])).map((bullet: string, bIndex: number) => ({
                                id: `bullet-${Date.now()}-${index}-${bIndex}`,
                                content: bullet,
                                isAIGenerated: false,
                            })),
                            skills: [],
                        })),
                    };
                }

                if (parsedData.education && Array.isArray(parsedData.education)) {
                    updateData.education = {
                        items: parsedData.education.map((edu: any, index: number) => ({
                            id: `edu-${Date.now()}-${index}`,
                            institution: edu.institution || edu.school || '',
                            degree: edu.degree || '',
                            field: edu.field || edu.major || '',
                            location: edu.location || '',
                            startDate: '',
                            endDate: edu.graduationYear || edu.graduationDate || '',
                            gpa: edu.gpa || '',
                            honors: '',
                            coursework: [],
                            activities: [],
                        })),
                    };
                }

                if (parsedData.skills && Array.isArray(parsedData.skills)) {
                    updateData.skills = { categories: [], simpleList: parsedData.skills };
                }
            }

            const patchResponse = await fetch(`/api/resumes/${resumeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!patchResponse.ok) {
                throw new Error('Failed to update resume');
            }

            toast.success(locale === 'ar' ? 'تم إنشاء السيرة الذاتية بنجاح!' : 'Resume created successfully!');
            router.push(`/dashboard/resumes/${resumeId}/edit`);
        } catch (error) {
            toast.error(locale === 'ar' ? 'فشل إنشاء السيرة الذاتية' : 'Failed to create resume');
        } finally {
            setIsLoading(false);
        }
    };

    // Check if can proceed to next step
    const canProceed = () => {
        if (step === 1) {
            if (!method) return false;
            if (method === 'import' && !uploadedFile) return false;
            return true;
        }
        return true;
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/resumes"
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {locale === 'ar' ? 'العودة للسير الذاتية' : 'Back to Resumes'}
                </Link>
                <h1 className="text-3xl font-bold">{locale === 'ar' ? 'إنشاء سيرة ذاتية جديدة' : 'Create New Resume'}</h1>
                <p className="text-muted-foreground mt-1">
                    {locale === 'ar' ? 'اختر كيف تريد البدء' : 'Choose how you\'d like to start building your resume'}
                </p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                        </div>
                        {s < 3 && (
                            <div
                                className={`h-0.5 w-12 ${step > s ? 'bg-primary' : 'bg-muted'}`}
                            />
                        )}
                    </div>
                ))}
                <span className="ml-4 text-sm text-muted-foreground">
                    {step === 1 && (locale === 'ar' ? 'اختر الطريقة' : 'Choose method')}
                    {step === 2 && (locale === 'ar' ? 'المعلومات الأساسية' : 'Basic info')}
                    {step === 3 && (locale === 'ar' ? 'اختر القالب' : 'Select template')}
                </span>
            </div>

            {/* Step 1: Choose Method */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card
                            className={`cursor-pointer transition-all ${method === 'scratch'
                                ? 'ring-2 ring-primary'
                                : 'hover:border-primary/50'
                                }`}
                            onClick={() => { setMethod('scratch'); removeFile(); }}
                        >
                            <CardContent className="pt-6 text-center">
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="h-6 w-6 text-blue-500" />
                                </div>
                                <h3 className="font-semibold">{locale === 'ar' ? 'من الصفر' : 'Start from Scratch'}</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {locale === 'ar' ? 'ابنِ سيرتك خطوة بخطوة مع الذكاء الاصطناعي' : 'Build your resume step by step with AI'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card
                            className={`cursor-pointer transition-all ${method === 'import'
                                ? 'ring-2 ring-primary'
                                : 'hover:border-primary/50'
                                }`}
                            onClick={() => setMethod('import')}
                        >
                            <CardContent className="pt-6 text-center">
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Upload className="h-6 w-6 text-green-500" />
                                </div>
                                <h3 className="font-semibold">{locale === 'ar' ? 'رفع ملف' : 'Import Existing'}</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {locale === 'ar' ? 'ارفع ملف PDF أو DOCX' : 'Upload a PDF or DOCX file'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card
                            className={`cursor-pointer transition-all opacity-50 ${method === 'linkedin'
                                ? 'ring-2 ring-primary'
                                : 'hover:border-primary/50'
                                }`}
                            onClick={() => toast.info(locale === 'ar' ? 'قريباً!' : 'Coming soon!')}
                        >
                            <CardContent className="pt-6 text-center">
                                <div className="h-12 w-12 rounded-full bg-sky-500/10 flex items-center justify-center mx-auto mb-4">
                                    <Linkedin className="h-6 w-6 text-sky-500" />
                                </div>
                                <h3 className="font-semibold">{locale === 'ar' ? 'استيراد LinkedIn' : 'LinkedIn Import'}</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {locale === 'ar' ? 'قريباً!' : 'Coming soon!'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* File Upload Area (shown when import is selected) */}
                    {method === 'import' && (
                        <Card className="border-dashed border-2">
                            <CardContent className="pt-6">
                                {!uploadedFile ? (
                                    <label className="cursor-pointer block">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <div className="text-center py-8">
                                            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="font-medium">
                                                {locale === 'ar' ? 'اضغط لرفع ملف أو اسحبه هنا' : 'Click to upload or drag and drop'}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                PDF, DOC, DOCX (max 10MB)
                                            </p>
                                        </div>
                                    </label>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                <File className="h-5 w-5 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{uploadedFile.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {(uploadedFile.size / 1024).toFixed(1)} KB
                                                    {isParsing && (
                                                        <span className="ml-2 text-primary">
                                                            <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                                                            {locale === 'ar' ? 'جارٍ التحليل...' : 'Parsing...'}
                                                        </span>
                                                    )}
                                                    {parsedData && (
                                                        <span className="ml-2 text-green-500">
                                                            <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                                            {locale === 'ar' ? 'تم التحليل' : 'Parsed'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={removeFile}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {parsedData && (
                                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                        <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">
                                            {locale === 'ar' ? 'البيانات المستخرجة:' : 'Extracted Data:'}
                                        </h4>
                                        <ul className="text-sm space-y-1 text-green-600 dark:text-green-300">
                                            {parsedData.name && <li>✓ {locale === 'ar' ? 'الاسم:' : 'Name:'} {parsedData.name}</li>}
                                            {parsedData.email && <li>✓ {locale === 'ar' ? 'البريد:' : 'Email:'} {parsedData.email}</li>}
                                            {parsedData.experience?.length > 0 && (
                                                <li>✓ {parsedData.experience.length} {locale === 'ar' ? 'خبرات عملية' : 'work experiences'}</li>
                                            )}
                                            {parsedData.skills?.length > 0 && (
                                                <li>✓ {parsedData.skills.length} {locale === 'ar' ? 'مهارات' : 'skills'}</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">{locale === 'ar' ? 'عنوان السيرة الذاتية' : 'Resume Title'}</Label>
                            <Input
                                id="title"
                                placeholder={locale === 'ar' ? 'مثال: سيرة مهندس البرمجيات' : 'e.g., Software Engineer Resume'}
                                value={basicInfo.title}
                                onChange={(e) =>
                                    setBasicInfo({ ...basicInfo, title: e.target.value })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {locale === 'ar' ? 'للمرجع فقط، لن يظهر في السيرة' : 'This is for your reference only, won\'t appear on the resume'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="targetRole">{locale === 'ar' ? 'الوظيفة المستهدفة (اختياري)' : 'Target Role (Optional)'}</Label>
                            <Input
                                id="targetRole"
                                placeholder={locale === 'ar' ? 'مثال: مهندس برمجيات أول' : 'e.g., Senior Software Engineer'}
                                value={basicInfo.targetRole}
                                onChange={(e) =>
                                    setBasicInfo({ ...basicInfo, targetRole: e.target.value })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {locale === 'ar' ? 'يساعد الذكاء الاصطناعي في تخصيص المقترحات' : 'Helps tailor AI suggestions for this specific role'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>{locale === 'ar' ? 'لغة السيرة الذاتية' : 'Resume Language'}</Label>
                            <Select
                                value={basicInfo.language}
                                onValueChange={(value: 'en' | 'ar') =>
                                    setBasicInfo({ ...basicInfo, language: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="ar">العربية (Arabic)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Select Template */}
            {step === 3 && (
                <div className="grid gap-4 sm:grid-cols-3">
                    {templates.map((template) => (
                        <Card
                            key={template.id}
                            className={`cursor-pointer transition-all ${basicInfo.template === template.id
                                ? 'ring-2 ring-primary'
                                : 'hover:border-primary/50'
                                }`}
                            onClick={() =>
                                setBasicInfo({ ...basicInfo, template: template.id })
                            }
                        >
                            <CardContent className="p-0">
                                <div className="h-40 bg-muted/50 flex items-center justify-center border-b">
                                    <FileText className="h-12 w-12 text-muted-foreground/30" />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold">{locale === 'ar' ? template.nameAr : template.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {locale === 'ar' ? template.descriptionAr : template.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button
                    variant="outline"
                    onClick={() => {
                        if (step === 1) {
                            router.push('/dashboard/resumes');
                        } else {
                            setStep((prev) => (prev - 1) as 1 | 2 | 3);
                        }
                    }}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'رجوع' : 'Back'}
                </Button>

                {step < 3 ? (
                    <Button
                        onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3)}
                        disabled={!canProceed() || isParsing}
                    >
                        {isParsing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {locale === 'ar' ? 'التالي' : 'Continue'}
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {locale === 'ar' ? 'إنشاء السيرة الذاتية' : 'Create Resume'}
                    </Button>
                )}
            </div>
        </div>
    );
}
