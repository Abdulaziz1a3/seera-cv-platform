'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Save,
    Download,
    Eye,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    FileText,
    User,
    Briefcase,
    GraduationCap,
    Wrench,
    FolderKanban,
    Award,
    Languages,
    Menu,
    X,
    Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ContactEditor } from '@/components/resume-editor/contact-editor';
import { SummaryEditor } from '@/components/resume-editor/summary-editor';
import { ExperienceEditor } from '@/components/resume-editor/experience-editor';
import { EducationEditor } from '@/components/resume-editor/education-editor';
import { SkillsEditor } from '@/components/resume-editor/skills-editor';
import { ProjectsEditor } from '@/components/resume-editor/projects-editor';
import { CertificationsEditor } from '@/components/resume-editor/certifications-editor';
import { LanguagesEditor } from '@/components/resume-editor/languages-editor';
import { ATSScorePanel } from '@/components/resume-editor/ats-score-panel';
import { TemplateSelector } from '@/components/resume-editor/template-selector';
import { LivePreview } from '@/components/resume-editor/live-preview';
import { useLocale } from '@/components/providers/locale-provider';
import { downloadPDF } from '@/lib/templates/renderer';
import { PaywallModal } from '@/components/paywall-modal';
import type { TemplateId, ThemeId } from '@/lib/resume-types';
import type { ResumeRecord } from '@/lib/resume-data';
import { mapResumeRecordToResumeData } from '@/lib/resume-normalizer';

const sections = [
    { id: 'contact', label: 'Contact', labelAr: 'معلومات التواصل', icon: User },
    { id: 'summary', label: 'Summary', labelAr: 'الملخص', icon: FileText },
    { id: 'experience', label: 'Experience', labelAr: 'الخبرات', icon: Briefcase },
    { id: 'education', label: 'Education', labelAr: 'التعليم', icon: GraduationCap },
    { id: 'skills', label: 'Skills', labelAr: 'المهارات', icon: Wrench },
    { id: 'projects', label: 'Projects', labelAr: 'المشاريع', icon: FolderKanban },
    { id: 'certifications', label: 'Certifications', labelAr: 'الشهادات', icon: Award },
    { id: 'languages', label: 'Languages', labelAr: 'اللغات', icon: Languages },
];

const AUTO_SAVE_DELAY = 5000; // 5 seconds

export default function ResumeEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { locale } = useLocale();
    const resumeId = params.id as string;

    const [resume, setResume] = useState<ResumeRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('contact');
    const [showPreview, setShowPreview] = useState(false); // Hidden by default on mobile
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [atsScore, setAtsScore] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
    const [paywallOpen, setPaywallOpen] = useState(false);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const resumeRef = useRef<ResumeRecord | null>(null);

    // Keep resumeRef in sync
    useEffect(() => {
        resumeRef.current = resume;
    }, [resume]);

    const normalizeResume = (data: ResumeRecord): ResumeRecord => ({
        ...data,
        contact: data.contact || { fullName: '', email: '' },
        template: data.template || 'prestige-executive',
        theme: data.theme || 'obsidian',
        summary: data.summary || { content: '' },
        experience: data.experience || { items: [] },
        education: data.education || { items: [] },
        skills: data.skills || { categories: [], simpleList: [] },
        projects: data.projects || { items: [] },
        certifications: data.certifications || { items: [] },
        languages: data.languages || { items: [] },
    });

    // Load resume from API
    useEffect(() => {
        const loadResume = async () => {
            try {
                const response = await fetch(`/api/resumes/${resumeId}`);
                if (!response.ok) {
                    throw new Error('Resume not found');
                }
                const data = await response.json();
                const normalized = normalizeResume(data);
                setResume(normalized);
                setAtsScore(normalized.atsScore ?? null);
                setLastSaved(new Date());
            } catch (error) {
                toast.error(locale === 'ar' ? 'لم يتم العثور على السيرة الذاتية' : 'Resume not found');
                router.push('/dashboard/resumes');
            } finally {
                setIsLoading(false);
            }
        };

        loadResume();
    }, [resumeId, router, locale]);

    useEffect(() => {
        let isMounted = true;
        fetch('/api/billing/status')
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
                if (!isMounted || !data) return;
                setIsSubscriptionActive(Boolean(data.isActive));
            })
            .catch(() => {
                if (!isMounted) return;
                setIsSubscriptionActive(false);
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // Check screen size and show preview on desktop
    useEffect(() => {
        const checkScreenSize = () => {
            setShowPreview(window.innerWidth >= 1280); // xl breakpoint
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Unsaved changes warning before navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = locale === 'ar'
                    ? 'لديك تغييرات غير محفوظة. هل تريد المغادرة؟'
                    : 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, locale]);

    // Save resume to API
    const saveResume = useCallback(async (showToast = true) => {
        const currentResume = resumeRef.current;
        if (!currentResume) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/resumes/${resumeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: currentResume.title,
                    targetRole: currentResume.targetRole,
                    contact: currentResume.contact,
                    summary: currentResume.summary,
                    experience: currentResume.experience,
                    education: currentResume.education,
                    skills: currentResume.skills,
                    projects: currentResume.projects,
                    certifications: currentResume.certifications,
                    languages: currentResume.languages,
                    template: currentResume.template,
                    theme: currentResume.theme,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save');
            }

            const payload = await response.json();
            setAtsScore(payload.atsScore ?? null);
            setHasUnsavedChanges(false);
            setLastSaved(new Date());
            if (showToast) {
                toast.success(locale === 'ar' ? 'تم حفظ السيرة الذاتية' : 'Resume saved');
            }
        } catch (error) {
            toast.error(locale === 'ar' ? 'فشل حفظ السيرة الذاتية' : 'Failed to save resume');
        } finally {
            setIsSaving(false);
        }
    }, [resumeId, locale]);

    // Auto-save handler with debounce
    const handleChange = useCallback((section: string, data: any) => {
        if (!resume) return;

        setResume(prev => prev ? { ...prev, [section]: data } : prev);
        setHasUnsavedChanges(true);

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Set new auto-save timer
        autoSaveTimerRef.current = setTimeout(() => {
            saveResume(false); // Auto-save without toast
        }, AUTO_SAVE_DELAY);
    }, [resume, saveResume]);

    // Cleanup auto-save timer
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, []);

    // Manual save handler
    const handleSave = async () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        await saveResume(true);
    };

    // Template and theme change handlers
    const handleTemplateChange = (templateId: TemplateId) => {
        if (!resume) return;
        handleChange('template', templateId);
    };

    const handleThemeChange = (themeId: ThemeId) => {
        if (!resume) return;
        handleChange('theme', themeId);
    };

    // Export resume
    const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
        if (!resume) return;
        if (!isSubscriptionActive) {
            setPaywallOpen(true);
            return;
        }

        try {
            const exportResume = mapResumeRecordToResumeData(resume);

            if (format === 'pdf') {
                await downloadPDF(exportResume);
                toast.success(locale === 'ar' ? 'تم تصدير PDF' : 'PDF exported successfully');
            } else if (format === 'txt') {
                let text = `${exportResume.contact.fullName}\n`;
                text += `${exportResume.contact.email} | ${exportResume.contact.phone}\n`;
                if (exportResume.contact.location) text += `${exportResume.contact.location}\n`;
                text += '\n';
                if (exportResume.summary) text += `SUMMARY\n${exportResume.summary}\n\n`;
                if (exportResume.experience.length) {
                    text += 'EXPERIENCE\n';
                    exportResume.experience.forEach(exp => {
                        text += `${exp.position} at ${exp.company}\n`;
                        exp.bullets.forEach(b => text += `• ${b}\n`);
                        text += '\n';
                    });
                }
                if (exportResume.education.length) {
                    text += 'EDUCATION\n';
                    exportResume.education.forEach(edu => {
                        text += `${edu.degree}${edu.field ? ' in ' + edu.field : ''}\n`;
                        text += `${edu.institution}\n\n`;
                    });
                }
                if (exportResume.skills.length) {
                    text += `SKILLS\n${exportResume.skills.join(', ')}\n`;
                }

                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${exportResume.title}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(locale === 'ar' ? 'تم تصدير النص' : 'TXT exported successfully');
            } else {
                toast.info(locale === 'ar' ? 'تصدير DOCX قريبًا' : 'DOCX export coming soon');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error(locale === 'ar' ? 'فشل التصدير' : 'Failed to export resume');
        }
    };

    // Format last saved time
    const formatLastSaved = () => {
        if (!lastSaved) return '';
        const now = new Date();
        const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

        if (diff < 10) return locale === 'ar' ? 'الآن' : 'Just now';
        if (diff < 60) return locale === 'ar' ? `قبل ${diff} ثانية` : `${diff}s ago`;
        if (diff < 3600) return locale === 'ar' ? `قبل ${Math.floor(diff / 60)} دقيقة` : `${Math.floor(diff / 60)}m ago`;
        return lastSaved.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Section navigation component (reusable)
    const SectionNav = ({ onSelect }: { onSelect?: () => void }) => (
        <nav className="p-2 space-y-1">
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => {
                        setActiveSection(section.id);
                        onSelect?.();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                >
                    <section.icon className="h-4 w-4" />
                    {locale === 'ar' ? section.labelAr : section.label}
                </button>
            ))}
        </nav>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!resume) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-muted-foreground">Resume not found</p>
                <Button asChild className="mt-4">
                    <Link href="/dashboard/resumes">Go to Resumes</Link>
                </Button>
            </div>
        );
    }

    const previewResume = resume ? mapResumeRecordToResumeData(resume) : null;

    return (
        <div className="flex flex-col h-full -m-6">
            {/* Editor Header */}
            <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b bg-card gap-2">
                <div className="flex items-center gap-2 lg:gap-4 min-w-0">
                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden flex-shrink-0"
                        onClick={() => setShowMobileSidebar(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                        <Link href="/dashboard/resumes">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <h1 className="font-semibold truncate">{resume.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {isSaving ? (
                                <span className="flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    {locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}
                                </span>
                            ) : hasUnsavedChanges ? (
                                <span className="flex items-center gap-1 text-amber-500">
                                    <AlertTriangle className="h-3 w-3" />
                                    {locale === 'ar' ? 'غير محفوظ' : 'Unsaved'}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-green-500">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <Clock className="h-3 w-3 ml-1" />
                                    {formatLastSaved()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                    {/* Template Selector - Hidden on mobile */}
                    <div className="hidden md:block">
                        <TemplateSelector
                            selectedTemplate={(resume.template as TemplateId) || 'prestige-executive'}
                            selectedTheme={(resume.theme as ThemeId) || 'obsidian'}
                            onTemplateChange={handleTemplateChange}
                            onThemeChange={handleThemeChange}
                        />
                    </div>

                    {/* ATS Score - Hidden on small screens */}
                    {atsScore !== null && (
                        <div className="hidden sm:flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg bg-muted">
                            <span className="text-xs text-muted-foreground hidden lg:inline">ATS</span>
                            <Badge
                                variant={
                                    atsScore >= 80 ? 'default' :
                                        atsScore >= 60 ? 'secondary' : 'outline'
                                }
                            >
                                {atsScore}%
                            </Badge>
                        </div>
                    )}

                    {/* AI Help - Hidden on mobile */}
                    <Button variant="outline" size="sm" className="hidden lg:flex">
                        <Sparkles className="h-4 w-4 mr-1" />
                        AI Help
                    </Button>

                    {/* Preview Toggle - Shows modal on mobile, panel on desktop */}
                    <Button
                        variant={showPreview ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                            if (window.innerWidth < 1280) {
                                setShowMobilePreview(true);
                            } else {
                                setShowPreview(!showPreview);
                            }
                        }}
                    >
                        <Eye className="h-4 w-4 lg:mr-1" />
                        <span className="hidden lg:inline">Preview</span>
                    </Button>

                    {/* Export */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 lg:mr-1" />
                                <span className="hidden lg:inline">Export</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport('pdf')}>
                                Export as PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('docx')}>
                                Export as DOCX
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport('txt')}>
                                Export as TXT
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Save */}
                    <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} size="sm">
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 lg:mr-1 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 lg:mr-1" />
                        )}
                        <span className="hidden lg:inline">Save</span>
                    </Button>
                </div>
            </header>

            {/* Editor Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Section Tabs (Desktop only) */}
                <aside className="hidden lg:block w-48 border-r bg-card overflow-y-auto">
                    <SectionNav />
                </aside>

                {/* Center Panel - Editor */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {/* Mobile section indicator */}
                    <div className="lg:hidden mb-4">
                        <Badge variant="outline" className="text-sm">
                            {sections.find(s => s.id === activeSection)?.[locale === 'ar' ? 'labelAr' : 'label']}
                        </Badge>
                    </div>

                    {activeSection === 'contact' && (
                        <ContactEditor
                            data={resume.contact ?? { fullName: '', email: '' }}
                            onChange={(data) => handleChange('contact', data)}
                        />
                    )}
                    {activeSection === 'summary' && (
                        <SummaryEditor
                            data={resume.summary as any}
                            onChange={(data) => handleChange('summary', data)}
                        />
                    )}
                    {activeSection === 'experience' && (
                        <ExperienceEditor
                            data={resume.experience as any}
                            onChange={(data) => handleChange('experience', data)}
                        />
                    )}
                    {activeSection === 'education' && (
                        <EducationEditor
                            data={resume.education as any}
                            onChange={(data) => handleChange('education', data)}
                        />
                    )}
                    {activeSection === 'skills' && (
                        <SkillsEditor
                            data={resume.skills as any}
                            onChange={(data) => handleChange('skills', data)}
                        />
                    )}
                    {activeSection === 'projects' && (
                        <ProjectsEditor
                            data={resume.projects?.items ?? []}
                            onChange={(data) => handleChange('projects', { items: data })}
                        />
                    )}
                    {activeSection === 'certifications' && (
                        <CertificationsEditor
                            data={resume.certifications?.items ?? []}
                            onChange={(data) => handleChange('certifications', { items: data })}
                        />
                    )}
                    {activeSection === 'languages' && (
                        <LanguagesEditor
                            data={resume.languages?.items ?? []}
                            onChange={(data) => handleChange('languages', { items: data })}
                        />
                    )}
                </main>

                {/* Right Panel - Preview & ATS (Desktop xl+ only) */}
                {showPreview && (
                    <aside className="hidden xl:flex w-[420px] border-l bg-muted/30 overflow-hidden flex-col">
                        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                            <TabsList className="mx-4 mt-4">
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                                <TabsTrigger value="ats">ATS Score</TabsTrigger>
                            </TabsList>
                            <TabsContent value="preview" className="flex-1 overflow-auto p-4">
                                <div className="flex justify-center">
                                    <LivePreview resume={previewResume as any} scale={0.52} />
                                </div>
                            </TabsContent>
                            <TabsContent value="ats" className="flex-1 overflow-auto p-4">
                                <ATSScorePanel resume={resume as any} score={atsScore} />
                            </TabsContent>
                        </Tabs>
                    </aside>
                )}
            </div>

            {/* Mobile Sidebar Dialog */}
            <Dialog open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
                <DialogContent className="max-w-[280px] h-auto p-0 gap-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>{locale === 'ar' ? 'الأقسام' : 'Sections'}</DialogTitle>
                    </DialogHeader>
                    <SectionNav onSelect={() => setShowMobileSidebar(false)} />
                </DialogContent>
            </Dialog>

            {/* Mobile Preview Dialog */}
            <Dialog open={showMobilePreview} onOpenChange={setShowMobilePreview}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>{locale === 'ar' ? 'معاينة السيرة الذاتية' : 'Resume Preview'}</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
                        <TabsList className="mx-4">
                            <TabsTrigger value="preview">{locale === 'ar' ? 'المعاينة' : 'Preview'}</TabsTrigger>
                            <TabsTrigger value="ats">{locale === 'ar' ? 'درجة ATS' : 'ATS Score'}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="preview" className="flex-1 overflow-auto p-4">
                            <div className="flex justify-center">
                                <LivePreview resume={previewResume as any} scale={0.6} />
                            </div>
                        </TabsContent>
                        <TabsContent value="ats" className="flex-1 overflow-auto p-4">
                            <ATSScorePanel resume={resume as any} score={atsScore} />
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
            <PaywallModal
                isOpen={paywallOpen}
                onClose={() => setPaywallOpen(false)}
                feature="download"
            />
        </div>
    );
}
