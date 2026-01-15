'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProjectItem } from '@/lib/resume-schema';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';

type Project = ProjectItem;

interface ProjectsEditorProps {
    data: Project[];
    onChange: (data: Project[]) => void;
}

export function ProjectsEditor({ data, onChange }: ProjectsEditorProps) {
    const { locale } = useLocale();

    const addProject = () => {
        onChange([
            ...data,
            {
                id: crypto.randomUUID(),
                name: '',
                role: '',
                description: '',
                url: '',
                bullets: [],
                technologies: [],
            },
        ]);
    };

    const updateProject = (id: string, field: keyof Project, value: any) => {
        onChange(
            data.map((project) =>
                project.id === id ? { ...project, [field]: value } : project
            )
        );
    };

    const removeProject = (id: string) => {
        onChange(data.filter((project) => project.id !== id));
    };

    const addTechnology = (id: string, tech: string) => {
        if (!tech.trim()) return;
        const project = data.find((p) => p.id === id);
        const technologies = project?.technologies ?? [];
        if (project && !technologies.includes(tech.trim())) {
            updateProject(id, 'technologies', [...technologies, tech.trim()]);
        }
    };

    const removeTechnology = (id: string, tech: string) => {
        const project = data.find((p) => p.id === id);
        const technologies = project?.technologies ?? [];
        if (project) {
            updateProject(
                id,
                'technologies',
                technologies.filter((t) => t !== tech)
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">
                        {locale === 'ar' ? 'المشاريع' : 'Projects'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                            ? 'أضف مشاريعك الشخصية أو المهنية'
                            : 'Add your personal or professional projects'}
                    </p>
                </div>
                <Button onClick={addProject}>
                    <Plus className="h-4 w-4 me-2" />
                    {locale === 'ar' ? 'إضافة مشروع' : 'Add Project'}
                </Button>
            </div>

            {data.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">
                            {locale === 'ar'
                                ? 'لم تضف أي مشاريع بعد'
                                : 'No projects added yet'}
                        </p>
                        <Button variant="outline" onClick={addProject}>
                            <Plus className="h-4 w-4 me-2" />
                            {locale === 'ar' ? 'إضافة أول مشروع' : 'Add Your First Project'}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {data.map((project, index) => (
                        <Card key={project.id}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-medium">
                                        {locale === 'ar' ? `مشروع ${index + 1}` : `Project ${index + 1}`}
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeProject(project.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>{locale === 'ar' ? 'اسم المشروع *' : 'Project Name *'}</Label>
                                        <Input
                                            value={project.name}
                                            onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                                            placeholder={locale === 'ar' ? 'اسم المشروع' : 'Project Name'}
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>{locale === 'ar' ? 'الوصف' : 'Description'}</Label>
                                        <Textarea
                                            value={project.description ?? ''}
                                            onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                            placeholder={locale === 'ar' ? 'وصف المشروع...' : 'Describe your project...'}
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>{locale === 'ar' ? 'رابط المشروع' : 'Project URL'}</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <LinkIcon className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    value={project.url ?? ''}
                                                    onChange={(e) => updateProject(project.id, 'url', e.target.value)}
                                                    placeholder="https://..."
                                                    className="ps-10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 sm:col-span-2">
                                        <Label>{locale === 'ar' ? 'التقنيات المستخدمة' : 'Technologies'}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder={locale === 'ar' ? 'أضف تقنية...' : 'Add technology...'}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addTechnology(project.id, (e.target as HTMLInputElement).value);
                                                        (e.target as HTMLInputElement).value = '';
                                                    }
                                                }}
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={(e) => {
                                                    const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                                                    if (input) {
                                                        addTechnology(project.id, input.value);
                                                        input.value = '';
                                                    }
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {(project.technologies ?? []).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {(project.technologies ?? []).map((tech) => (
                                                    <Badge
                                                        key={tech}
                                                        variant="secondary"
                                                        className="cursor-pointer hover:bg-destructive/10"
                                                        onClick={() => removeTechnology(project.id, tech)}
                                                    >
                                                        {tech}
                                                        <Trash2 className="h-3 w-3 ms-1 text-destructive" />
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
