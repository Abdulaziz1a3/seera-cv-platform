'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useLocale } from '@/components/providers/locale-provider';
import { ProfileEditor } from '@/components/seera-link/profile-editor';
import { personaConfigs } from '@/lib/seera-link/themes';
import type { CreateProfileInput } from '@/lib/seera-link/schemas';

interface Resume {
  id: string;
  title: string;
  targetRole: string | null;
}

const translations = {
  en: {
    title: 'Create Seera Link',
    back: 'Back to Seera Link',
    startFrom: 'Start From',
    scratch: 'Start from Scratch',
    scratchDescription: 'Build your profile manually with full control',
    fromResume: 'Generate from Resume',
    fromResumeDescription: 'Auto-fill your profile from an existing resume',
    selectResume: 'Select a resume',
    noResumes: 'No resumes available',
    createResumeFirst: 'Create a resume first to use this option',
    generating: 'Generating profile...',
    createResume: 'Create Resume',
    persona: 'Persona',
    personaDescription: 'Choose a persona to customize default settings',
  },
  ar: {
    title: 'إنشاء رابط سيرا',
    back: 'العودة إلى رابط سيرا',
    startFrom: 'البدء من',
    scratch: 'البدء من الصفر',
    scratchDescription: 'قم ببناء ملفك يدوياً مع تحكم كامل',
    fromResume: 'إنشاء من السيرة الذاتية',
    fromResumeDescription: 'ملء تلقائي من سيرة ذاتية موجودة',
    selectResume: 'اختر سيرة ذاتية',
    noResumes: 'لا توجد سير ذاتية',
    createResumeFirst: 'قم بإنشاء سيرة ذاتية أولاً لاستخدام هذا الخيار',
    generating: 'جاري إنشاء الملف...',
    createResume: 'إنشاء سيرة ذاتية',
    persona: 'الشخصية',
    personaDescription: 'اختر شخصية لتخصيص الإعدادات الافتراضية',
  },
};

type Step = 'select' | 'editor';

export default function NewSeeraLinkPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const t = translations[locale as keyof typeof translations] || translations.en;

  const [step, setStep] = useState<Step>('select');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>('JOBS');
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialData, setInitialData] = useState<Partial<CreateProfileInput> | null>(null);

  // Fetch resumes
  useEffect(() => {
    async function fetchResumes() {
      try {
        const response = await fetch('/api/resumes');
        const data = await response.json();
        if (data.success || Array.isArray(data)) {
          setResumes(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error('Error fetching resumes:', error);
      }
    }
    fetchResumes();
  }, []);

  const handleStartFromScratch = () => {
    const persona = personaConfigs[selectedPersona];
    setInitialData({
      persona: selectedPersona as 'JOBS' | 'FREELANCE' | 'NETWORKING' | 'CUSTOM',
      enabledCtas: persona.defaultCtas as ('WHATSAPP' | 'PHONE' | 'EMAIL' | 'LINKEDIN' | 'DOWNLOAD_CV' | 'VIEW_CV' | 'CUSTOM')[],
      statusBadges: persona.defaultBadges,
      displayName: '',
      title: '',
      slug: '',
    });
    setStep('editor');
  };

  const handleGenerateFromResume = async () => {
    if (!selectedResume) {
      toast.error('Please select a resume');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/seera-link/generate-from-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: selectedResume }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate profile');
      }

      const persona = personaConfigs[selectedPersona];
      setInitialData({
        ...data.data.profileData,
        persona: selectedPersona as 'JOBS' | 'FREELANCE' | 'NETWORKING' | 'CUSTOM',
        enabledCtas: data.data.profileData.enabledCtas.length > 0
          ? data.data.profileData.enabledCtas
          : persona.defaultCtas as ('WHATSAPP' | 'PHONE' | 'EMAIL' | 'LINKEDIN' | 'DOWNLOAD_CV' | 'VIEW_CV' | 'CUSTOM')[],
        statusBadges: persona.defaultBadges,
      });
      setStep('editor');
    } catch (error) {
      console.error('Error generating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate profile');
    } finally {
      setIsGenerating(false);
    }
  };

  if (step === 'editor' && initialData) {
    return (
      <ProfileEditor
        mode="create"
        initialData={initialData}
        onCancel={() => setStep('select')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/seera-link">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground">{t.startFrom}</p>
        </div>
      </div>

      {/* Persona Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.persona}</CardTitle>
          <CardDescription>{t.personaDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPersona} onValueChange={setSelectedPersona}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(personaConfigs).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {locale === 'ar' ? config.nameAr : config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Start from Scratch */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
          onClick={handleStartFromScratch}
        >
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>{t.scratch}</CardTitle>
            <CardDescription>{t.scratchDescription}</CardDescription>
          </CardHeader>
        </Card>

        {/* Generate from Resume */}
        <Card className={`${resumes.length === 0 ? 'opacity-60' : ''}`}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>{t.fromResume}</CardTitle>
            <CardDescription>{t.fromResumeDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {resumes.length > 0 ? (
              <div className="space-y-4">
                <Select value={selectedResume || ''} onValueChange={setSelectedResume}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectResume} />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.title}
                        {resume.targetRole && ` - ${resume.targetRole}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={handleGenerateFromResume}
                  disabled={!selectedResume || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t.fromResume}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {t.createResumeFirst}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/resumes/new">
                    {t.createResume}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
