'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AIPolishButton } from '@/components/ui/ai-polish-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';
import {
    type ExperienceSection as Experience,
    type ExperienceItem,
    createEmptyExperienceItem
} from '@/lib/resume-schema';

interface ExperienceEditorProps {
    data: Experience | undefined;
    onChange: (data: Experience) => void;
}

export function ExperienceEditor({ data, onChange }: ExperienceEditorProps) {
    const items = data?.items || [];
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(items.map(i => i.id)));
    const [generatingFor, setGeneratingFor] = useState<string | null>(null);

    const handleAddExperience = () => {
        const newItem = createEmptyExperienceItem();
        onChange({ items: [...items, newItem] });
        setExpandedItems(new Set([...Array.from(expandedItems), newItem.id]));
        toast.success('Experience added');
    };

    const handleRemoveExperience = (id: string) => {
        onChange({ items: items.filter(item => item.id !== id) });
        toast.success('Experience removed');
    };

    const handleUpdateExperience = (id: string, updates: Partial<ExperienceItem>) => {
        onChange({
            items: items.map(item =>
                item.id === id ? { ...item, ...updates } : item
            ),
        });
    };

    const handleAddBullet = (expId: string) => {
        const exp = items.find(item => item.id === expId);
        if (!exp) return;

        handleUpdateExperience(expId, {
            bullets: [...(exp.bullets || []), { id: crypto.randomUUID(), content: '', isAIGenerated: false }],
        });
    };

    const handleUpdateBullet = (expId: string, bulletId: string, content: string) => {
        const exp = items.find(item => item.id === expId);
        if (!exp) return;

        handleUpdateExperience(expId, {
            bullets: exp.bullets?.map(b =>
                b.id === bulletId ? { ...b, content } : b
            ),
        });
    };

    const handleRemoveBullet = (expId: string, bulletId: string) => {
        const exp = items.find(item => item.id === expId);
        if (!exp) return;

        handleUpdateExperience(expId, {
            bullets: exp.bullets?.filter(b => b.id !== bulletId),
        });
    };

    const handleGenerateBullets = async (expId: string) => {
        const exp = items.find(item => item.id === expId);
        if (!exp) return;

        setGeneratingFor(expId);
        try {
            const response = await fetch('/api/ai/generate-bullets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company: exp.company,
                    position: exp.position,
                    description: exp.description,
                    existingBullets: exp.bullets?.map(b => b.content) || [],
                }),
            });

            if (await handleAICreditsResponse(response)) {
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to generate');
            }

            const { bullets } = await response.json();
            const newBullets = bullets.map((content: string) => ({
                id: crypto.randomUUID(),
                content,
            }));

            handleUpdateExperience(expId, {
                bullets: [...(exp.bullets || []), ...newBullets],
            });

            toast.success('Bullet points generated!');
        } catch (error) {
            toast.error('Failed to generate bullet points');
        } finally {
            setGeneratingFor(null);
        }
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Work Experience</h2>
                    <p className="text-muted-foreground mt-1">
                        Add your work history, starting with your most recent position.
                    </p>
                </div>
                <Button onClick={handleAddExperience}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Experience
                </Button>
            </div>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">
                            No work experience added yet. Add your first role to get started.
                        </p>
                        <Button onClick={handleAddExperience}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Experience
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {items.map((exp, index) => (
                        <Card key={exp.id}>
                            <CardHeader
                                className="cursor-pointer"
                                onClick={() => toggleExpand(exp.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="cursor-grab text-muted-foreground">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">
                                            {exp.position || 'New Position'}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {exp.company || 'Company'} • {exp.startDate || 'Start'} - {exp.isCurrent ? 'Present' : (exp.endDate || 'End')}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{index + 1}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveExperience(exp.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    {expandedItems.has(exp.id) ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </CardHeader>

                            {expandedItems.has(exp.id) && (
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label required>Job Title</Label>
                                            <Input
                                                placeholder="Software Engineer"
                                                value={exp.position}
                                                onChange={(e) => handleUpdateExperience(exp.id, { position: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label required>Company</Label>
                                            <Input
                                                placeholder="Tech Company Inc."
                                                value={exp.company}
                                                onChange={(e) => handleUpdateExperience(exp.id, { company: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input
                                                placeholder="New York, NY"
                                                value={exp.location || ''}
                                                onChange={(e) => handleUpdateExperience(exp.id, { location: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label required>Start Date</Label>
                                            <Input
                                                placeholder="Jan 2020"
                                                value={exp.startDate}
                                                onChange={(e) => handleUpdateExperience(exp.id, { startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="Dec 2023"
                                                    value={exp.endDate || ''}
                                                    disabled={exp.isCurrent}
                                                    onChange={(e) => handleUpdateExperience(exp.id, { endDate: e.target.value })}
                                                />
                                                <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={exp.isCurrent}
                                                        onChange={(e) => handleUpdateExperience(exp.id, { isCurrent: e.target.checked, endDate: '' })}
                                                    />
                                                    Current
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Bullet Points */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label>Achievements & Responsibilities</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleGenerateBullets(exp.id)}
                                                disabled={generatingFor === exp.id}
                                            >
                                                {generatingFor === exp.id ? (
                                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                ) : (
                                                    <Sparkles className="h-4 w-4 mr-1" />
                                                )}
                                                Generate with AI
                                            </Button>
                                        </div>

                                        {exp.bullets?.map((bullet, bIndex) => (
                                            <div key={bullet.id} className="flex gap-2">
                                                <span className="text-muted-foreground mt-2">•</span>
                                                <div className="flex-1 relative">
                                                    <Textarea
                                                        placeholder="Start with an action verb (e.g., Led, Developed, Increased...)"
                                                        className="min-h-[70px] resize-none pb-8"
                                                        value={bullet.content}
                                                        onChange={(e) => handleUpdateBullet(exp.id, bullet.id, e.target.value)}
                                                    />
                                                    <div className="absolute bottom-2 right-2 z-10">
                                                        <AIPolishButton
                                                            value={bullet.content}
                                                            onApply={(val) => handleUpdateBullet(exp.id, bullet.id, val)}
                                                            type="bullet"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 hover:bg-muted"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveBullet(exp.id, bullet.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddBullet(exp.id)}
                                            className="w-full"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Bullet Point
                                        </Button>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
