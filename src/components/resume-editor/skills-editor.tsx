'use client';

import { useState } from 'react';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SkillsSection, SkillCategory } from '@/lib/resume-schema';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';

interface SkillsEditorProps {
    data: SkillsSection | undefined;
    onChange: (data: SkillsSection) => void;
}

const suggestedSkills = {
    technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'Docker', 'AWS', 'REST APIs'],
    soft: ['Leadership', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Adaptability'],
    tools: ['VS Code', 'Jira', 'Figma', 'Slack', 'GitHub', 'Notion', 'Microsoft Office', 'Google Workspace'],
};

export function SkillsEditor({ data, onChange }: SkillsEditorProps) {
    const [newSkill, setNewSkill] = useState('');
    const [skillMode, setSkillMode] = useState<'simple' | 'categorized'>(
        data?.categories && data.categories.length > 0 ? 'categorized' : 'simple'
    );
    const [isExtracting, setIsExtracting] = useState(false);

    const simpleList = data?.simpleList || [];
    const categories = data?.categories || [];

    // Simple list handlers
    const handleAddSkill = () => {
        if (!newSkill.trim()) return;
        if (simpleList.includes(newSkill.trim())) {
            toast.error('Skill already added');
            return;
        }
        onChange({ categories: categories, simpleList: [...simpleList, newSkill.trim()] });
        setNewSkill('');
    };

    const handleRemoveSkill = (skill: string) => {
        onChange({ categories: categories, simpleList: simpleList.filter((s: string) => s !== skill) });
    };

    const handleAddSuggestedSkill = (skill: string) => {
        if (simpleList.includes(skill)) {
            toast.error('Skill already added');
            return;
        }
        onChange({ categories: categories, simpleList: [...simpleList, skill] });
        toast.success(`Added: ${skill}`);
    };

    // Category handlers
    const handleAddCategory = () => {
        const newCategory: SkillCategory = {
            id: crypto.randomUUID(),
            name: '',
            skills: [],
        };
        onChange({ categories: [...categories, newCategory], simpleList });
    };

    const handleRemoveCategory = (id: string) => {
        onChange({ categories: categories.filter((c: SkillCategory) => c.id !== id), simpleList });
    };

    const handleUpdateCategory = (id: string, updates: Partial<SkillCategory>) => {
        onChange({
            categories: categories.map((c: SkillCategory) => (c.id === id ? { ...c, ...updates } : c)),
            simpleList,
        });
    };

    const handleAddSkillToCategory = (categoryId: string, skill: string) => {
        const category = categories.find((c: SkillCategory) => c.id === categoryId);
        if (!category) return;
        if (category.skills.includes(skill)) {
            toast.error('Skill already in category');
            return;
        }
        handleUpdateCategory(categoryId, { skills: [...category.skills, skill] });
    };

    const handleRemoveSkillFromCategory = (categoryId: string, skill: string) => {
        const category = categories.find((c: SkillCategory) => c.id === categoryId);
        if (!category) return;
        handleUpdateCategory(categoryId, { skills: category.skills.filter((s: string) => s !== skill) });
    };

    // Extract skills from job description
    const handleExtractSkills = async () => {
        const jobDescription = prompt('Paste a job description to extract relevant skills:');
        if (!jobDescription) return;

        setIsExtracting(true);
        try {
            const response = await fetch('/api/ai/extract-skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobDescription }),
            });

            if (await handleAICreditsResponse(response)) {
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to extract skills');
            }

            const { skills: extractedSkills } = await response.json();
            const newSkills = extractedSkills.filter((s: string) => !simpleList.includes(s));
            onChange({ categories, simpleList: [...simpleList, ...newSkills] });
            toast.success(`Extracted ${newSkills.length} new skills!`);
        } catch (error) {
            toast.error('Failed to extract skills');
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Skills</h2>
                    <p className="text-muted-foreground mt-1">
                        List your technical skills, tools, and competencies relevant to your target role.
                    </p>
                </div>
                <Button variant="outline" onClick={handleExtractSkills} disabled={isExtracting}>
                    {isExtracting ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    Extract from Job
                </Button>
            </div>

            <Tabs value={skillMode} onValueChange={(v) => setSkillMode(v as 'simple' | 'categorized')}>
                <TabsList>
                    <TabsTrigger value="simple">Simple List</TabsTrigger>
                    <TabsTrigger value="categorized">By Category</TabsTrigger>
                </TabsList>

                <TabsContent value="simple" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Your Skills</CardTitle>
                            <CardDescription>Add skills as a comma-separated list</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a skill and press Enter"
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSkill();
                                        }
                                    }}
                                />
                                <Button onClick={handleAddSkill}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {simpleList.map((skill: string) => (
                                    <Badge key={skill} variant="secondary" className="text-sm">
                                        {skill}
                                        <button
                                            onClick={() => handleRemoveSkill(skill)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {simpleList.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No skills added yet</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Suggested Skills */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Suggested Skills</CardTitle>
                            <CardDescription>Click to add commonly requested skills</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-xs text-muted-foreground">Technical</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {suggestedSkills.technical.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                            onClick={() => handleAddSuggestedSkill(skill)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Soft Skills</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {suggestedSkills.soft.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                            onClick={() => handleAddSuggestedSkill(skill)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Tools</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {suggestedSkills.tools.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                            onClick={() => handleAddSuggestedSkill(skill)}
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categorized" className="space-y-4 mt-6">
                    {categories.map((category: SkillCategory) => (
                        <Card key={category.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <Input
                                        placeholder="Category name (e.g., Programming Languages)"
                                        value={category.name}
                                        onChange={(e) => handleUpdateCategory(category.id, { name: e.target.value })}
                                        className="font-medium"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveCategory(category.id)}
                                    >
                                        <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {category.skills.map((skill: string) => (
                                        <Badge key={skill} variant="secondary">
                                            {skill}
                                            <button
                                                onClick={() => handleRemoveSkillFromCategory(category.id, skill)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Add skill to this category"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                            handleAddSkillToCategory(category.id, e.currentTarget.value.trim());
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="outline" onClick={handleAddCategory} className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Category
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}
