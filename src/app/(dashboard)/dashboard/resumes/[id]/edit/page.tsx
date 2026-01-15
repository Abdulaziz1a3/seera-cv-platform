'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Save,
    Download,
    Eye,
    Settings,
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
    MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { useResumes, calculateATSScore, type ResumeData } from '@/components/providers/resume-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { downloadPDF } from '@/lib/templates/renderer';
import type { TemplateId, ThemeId } from '@/lib/resume-types';

const sections = [
    { id: 'contact', label: 'Contact', icon: User },
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Wrench },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'languages', label: 'Languages', icon: Languages },
];

export default function ResumeEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { locale } = useLocale();
    const { getResume, updateResume: saveResume } = useResumes();
    const resumeId = params.id as string;

    const [resume, setResume] = useState<ResumeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('contact');
    const [showPreview, setShowPreview] = useState(true);
    const [atsScore, setAtsScore] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Load resume from localStorage
    useEffect(() => {
        const storedResume = getResume(resumeId);
        if (storedResume) {
            setResume(storedResume);
            setAtsScore(calculateATSScore(storedResume));
        } else {
            toast.error(locale === 'ar' ? 'السيرة غير موجودة' : 'Resume not found');
            router.push('/dashboard/resumes');
        }
        setIsLoading(false);
    }, [resumeId, getResume, router, locale]);

    // Auto-save handler
    const handleChange = (section: string, data: any) => {
        if (!resume) return;

        setResume({
            ...resume,
            [section]: data,
        });
        setHasUnsavedChanges(true);
    };

    // Save resume to localStorage
    const handleSave = async () => {
        if (!resume) return;

        setIsSaving(true);
        try {
            // Save to localStorage via context
            saveResume(resumeId, resume);

            // Recalculate ATS score
            const newScore = calculateATSScore(resume);
            setAtsScore(newScore);
            setHasUnsavedChanges(false);
            toast.success(locale === 'ar' ? 'تم الحفظ' : 'Resume saved');
        } catch (error) {
            toast.error(locale === 'ar' ? 'فشل الحفظ' : 'Failed to save resume');
        } finally {
            setIsSaving(false);
        }
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

    // Export resume (client-side for now)
    const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
        if (!resume) return;

        try {
            if (format === 'pdf') {
                // Use the new premium template PDF generator
                await downloadPDF(resume as ResumeData);
                toast.success(locale === 'ar' ? 'تم تصدير PDF' : 'PDF exported successfully');
            } else if (format === 'txt') {
                // Generate plain text
                let text = `${resume.contact.fullName}\n`;
                text += `${resume.contact.email} | ${resume.contact.phone}\n`;
                if (resume.contact.location) text += `${resume.contact.location}\n`;
                text += '\n';
                if (resume.summary) text += `SUMMARY\n${resume.summary}\n\n`;
                if (resume.experience.length) {
                    text += 'EXPERIENCE\n';
                    resume.experience.forEach(exp => {
                        text += `${exp.position} at ${exp.company}\n`;
                        exp.bullets.forEach(b => text += `• ${b}\n`);
                        text += '\n';
                    });
                }
                if (resume.education.length) {
                    text += 'EDUCATION\n';
                    resume.education.forEach(edu => {
                        text += `${edu.degree}${edu.field ? ' in ' + edu.field : ''}\n`;
                        text += `${edu.institution}\n\n`;
                    });
                }
                if (resume.skills.length) {
                    text += `SKILLS\n${resume.skills.join(', ')}\n`;
                }

                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${resume.title}.txt`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(locale === 'ar' ? 'تم تصدير النص' : 'TXT exported successfully');
            } else {
                toast.info(locale === 'ar' ? 'DOCX قريباً' : 'DOCX export coming soon');
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error(locale === 'ar' ? 'فشل التصدير' : 'Failed to export resume');
        }
    };

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

    return (
        <div className="flex flex-col h-full -m-6">
            {/* Editor Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/resumes">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-semibold">{resume.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {hasUnsavedChanges ? (
                                <span className="flex items-center gap-1 text-warning">
                                    <AlertTriangle className="h-3 w-3" />
                                    Unsaved changes
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-success">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Saved
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Template Selector */}
                    <TemplateSelector
                        selectedTemplate={(resume.template as TemplateId) || 'prestige-executive'}
                        selectedTheme={(resume.theme as ThemeId) || 'obsidian'}
                        onTemplateChange={handleTemplateChange}
                        onThemeChange={handleThemeChange}
                    />

                    {/* ATS Score */}
                    {atsScore !== null && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                            <span className="text-xs text-muted-foreground">ATS</span>
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

                    {/* AI Assistant */}
                    <Button variant="outline" size="sm">
                        <Sparkles className="h-4 w-4 mr-1" />
                        AI Help
                    </Button>

                    {/* Preview Toggle */}
                    <Button
                        variant={showPreview ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                    </Button>

                    {/* Export */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                Export
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
                    <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                    </Button>
                </div>
            </header>

            {/* Editor Body */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Section Tabs */}
                <aside className="w-48 border-r bg-card overflow-y-auto">
                    <nav className="p-2 space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                <section.icon className="h-4 w-4" />
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Center Panel - Editor */}
                <main className="flex-1 overflow-y-auto p-6">
                    {activeSection === 'contact' && (
                        <ContactEditor
                            data={resume.contact}
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
                            data={resume.projects || []}
                            onChange={(data) => handleChange('projects', data)}
                        />
                    )}
                    {activeSection === 'certifications' && (
                        <CertificationsEditor
                            data={resume.certifications || []}
                            onChange={(data) => handleChange('certifications', data)}
                        />
                    )}
                    {activeSection === 'languages' && (
                        <LanguagesEditor
                            data={resume.languages || []}
                            onChange={(data) => handleChange('languages', data)}
                        />
                    )}
                </main>

                {/* Right Panel - Preview & ATS */}
                {showPreview && (
                    <aside className="w-[420px] border-l bg-muted/30 overflow-hidden flex flex-col">
                        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                            <TabsList className="mx-4 mt-4">
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                                <TabsTrigger value="ats">ATS Score</TabsTrigger>
                            </TabsList>
                            <TabsContent value="preview" className="flex-1 overflow-auto p-4">
                                <div className="flex justify-center">
                                    <LivePreview resume={resume as ResumeData} scale={0.52} />
                                </div>
                            </TabsContent>
                            <TabsContent value="ats" className="flex-1 overflow-auto p-4">
                                <ATSScorePanel resume={resume as any} score={atsScore} />
                            </TabsContent>
                        </Tabs>
                    </aside>
                )}
            </div>
        </div>
    );
}
