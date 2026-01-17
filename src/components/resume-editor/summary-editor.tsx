'use client';

import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AIPolishButton } from '@/components/ui/ai-polish-button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { handleAICreditsResponse } from '@/lib/ai-credits-client';

interface SummaryEditorProps {
    data: { content?: string } | undefined;
    onChange: (data: { content: string }) => void;
}

const exampleSummaries = [
    "Results-driven software engineer with 5+ years of experience building scalable web applications. Proven track record of reducing load times by 40% and improving user engagement through innovative solutions. Expertise in React, Node.js, and cloud technologies.",
    "Strategic marketing professional with 8 years of experience driving brand growth and customer acquisition. Led campaigns generating $2M+ in revenue. Skilled in digital marketing, data analytics, and team leadership.",
    "Detail-oriented financial analyst with strong expertise in financial modeling, forecasting, and risk assessment. Consistently delivered insights that improved profitability by 15% across multiple business units.",
];

export function SummaryEditor({ data, onChange }: SummaryEditorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const content = data?.content || '';
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/ai/generate-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentContent: content }),
            });

            if (await handleAICreditsResponse(response)) {
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to generate');
            }

            const { summary } = await response.json();
            onChange({ content: summary });
            toast.success('Summary generated!');
        } catch (error) {
            toast.error('Failed to generate summary. Try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseExample = (example: string) => {
        onChange({ content: example });
        toast.success('Example applied!');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Professional Summary</h2>
                <p className="text-muted-foreground mt-1">
                    A brief overview of your professional background, key skills, and career highlights.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Your Summary</CardTitle>
                            <CardDescription>2-4 sentences highlighting your value proposition</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 mr-1" />
                            )}
                            Generate with AI
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 relative">
                        <Textarea
                            placeholder="Write a compelling summary that highlights your experience, skills, and achievements..."
                            className="min-h-[150px] resize-none pb-10" // Add padding bottom for the button
                            value={content}
                            onChange={(e) => onChange({ content: e.target.value })}
                        />
                        <div className="absolute bottom-3 right-3 z-10">
                            <AIPolishButton
                                value={content}
                                onApply={(val) => onChange({ content: val })}
                                type="summary"
                                variant="secondary"
                                size="sm"
                                className="h-8 shadow-sm border"
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                            <span>{wordCount} words</span>
                            <span>
                                {wordCount < 20 && <Badge variant="outline">Too short</Badge>}
                                {wordCount >= 20 && wordCount <= 75 && <Badge variant="default">Good length</Badge>}
                                {wordCount > 75 && <Badge variant="secondary">Consider shortening</Badge>}
                            </span>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="rounded-lg bg-muted p-4">
                        <h4 className="font-medium text-sm mb-2">Tips for a great summary:</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Start with your professional title and years of experience</li>
                            <li>• Include 2-3 key achievements with quantifiable results</li>
                            <li>• Mention your top skills relevant to your target role</li>
                            <li>• Avoid using first-person pronouns (I, me, my)</li>
                            <li>• Keep it between 50-150 words for optimal readability</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Examples */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Example Summaries</CardTitle>
                    <CardDescription>Click to use as a starting point</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {exampleSummaries.map((example, index) => (
                        <button
                            key={index}
                            onClick={() => handleUseExample(example)}
                            className="w-full text-left p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors"
                        >
                            <p className="text-sm">{example}</p>
                            <Badge variant="outline" className="mt-2">
                                Use this template
                            </Badge>
                        </button>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
