'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EducationSection, EducationItem } from '@/lib/resume-schema';

interface EducationEditorProps {
    data: EducationSection | undefined;
    onChange: (data: EducationSection) => void;
}

function createEmptyEducation(): EducationItem {
    return {
        id: crypto.randomUUID(),
        institution: '',
        degree: '',
        field: '',
        location: '',
        startDate: '',
        endDate: '',
        gpa: '',
        coursework: [],
        activities: [],
    };
}

export function EducationEditor({ data, onChange }: EducationEditorProps) {
    const items = data?.items || [];
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(items.map((i: EducationItem) => i.id)));

    const handleAddEducation = () => {
        const newItem = createEmptyEducation();
        onChange({ items: [...items, newItem] });
        setExpandedItems(new Set([...Array.from(expandedItems), newItem.id]));
        toast.success('Education added');
    };

    const handleRemoveEducation = (id: string) => {
        onChange({ items: items.filter((item: EducationItem) => item.id !== id) });
        toast.success('Education removed');
    };

    const handleUpdateEducation = (id: string, updates: Partial<EducationItem>) => {
        onChange({
            items: items.map((item: EducationItem) =>
                item.id === id ? { ...item, ...updates } : item
            ),
        });
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
                    <h2 className="text-2xl font-bold">Education</h2>
                    <p className="text-muted-foreground mt-1">
                        Add your educational background, including degrees, certifications, and relevant coursework.
                    </p>
                </div>
                <Button onClick={handleAddEducation}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Education
                </Button>
            </div>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">
                            No education added yet. Add your educational background.
                        </p>
                        <Button onClick={handleAddEducation}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Education
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {items.map((edu: EducationItem, index: number) => (
                        <Card key={edu.id}>
                            <CardHeader
                                className="cursor-pointer"
                                onClick={() => toggleExpand(edu.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="cursor-grab text-muted-foreground">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base">
                                            {edu.degree || 'New Degree'} {edu.field && `in ${edu.field}`}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {edu.institution || 'Institution'} • {edu.startDate || 'Start'} - {edu.endDate || 'End'}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{index + 1}</Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveEducation(edu.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    {expandedItems.has(edu.id) ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </CardHeader>

                            {expandedItems.has(edu.id) && (
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label required>Institution</Label>
                                            <Input
                                                placeholder="University of Technology"
                                                value={edu.institution}
                                                onChange={(e) => handleUpdateEducation(edu.id, { institution: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input
                                                placeholder="Boston, MA"
                                                value={edu.location || ''}
                                                onChange={(e) => handleUpdateEducation(edu.id, { location: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label required>Degree</Label>
                                            <Input
                                                placeholder="Bachelor of Science"
                                                value={edu.degree}
                                                onChange={(e) => handleUpdateEducation(edu.id, { degree: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Field of Study</Label>
                                            <Input
                                                placeholder="Computer Science"
                                                value={edu.field || ''}
                                                onChange={(e) => handleUpdateEducation(edu.id, { field: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input
                                                placeholder="Sep 2016"
                                                value={edu.startDate || ''}
                                                onChange={(e) => handleUpdateEducation(edu.id, { startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input
                                                placeholder="May 2020"
                                                value={edu.endDate || ''}
                                                onChange={(e) => handleUpdateEducation(edu.id, { endDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>GPA (Optional)</Label>
                                            <Input
                                                placeholder="3.8/4.0"
                                                value={edu.gpa || ''}
                                                onChange={(e) => handleUpdateEducation(edu.id, { gpa: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Coursework & Activities (Optional)</Label>
                                        <Textarea
                                            placeholder="Dean's List, Relevant coursework, Research projects, Student organizations..."
                                            className="min-h-[80px]"
                                            value={[...(edu.coursework || []), ...(edu.activities || [])].join('\n') || ''}
                                            onChange={(e) => {
                                                const lines = e.target.value.split('\n').filter(Boolean);
                                                handleUpdateEducation(edu.id, {
                                                    coursework: lines.slice(0, Math.ceil(lines.length / 2)),
                                                    activities: lines.slice(Math.ceil(lines.length / 2))
                                                });
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter each item on a new line
                                        </p>
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
