// AI Provider Abstraction Layer
// Supports multiple LLM providers: OpenAI, Anthropic, Google

import { calculateChatCostUsd, calculateCreditsFromUsd, recordAICreditUsage } from '@/lib/ai-credits';

export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AICompletionOptions {
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
}

export interface AIResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

const MODEL_BY_PROVIDER: Record<AIProvider, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-opus-20240229',
    google: 'gemini-pro',
};

interface AITracking {
    userId?: string;
    operation?: string;
}

async function recordAIUsage(tracking: AITracking | undefined, usage?: AIResponse['usage'], provider?: AIProvider) {
    if (!tracking?.userId || !usage?.totalTokens) return;

    const model = MODEL_BY_PROVIDER[provider || 'openai'];
    const costUsd = calculateChatCostUsd({
        model,
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
    });
    const { costSar, credits } = calculateCreditsFromUsd(costUsd);

    await recordAICreditUsage({
        userId: tracking.userId,
        provider: provider || 'openai',
        model,
        operation: tracking.operation || 'ai_generation',
        promptTokens: usage.promptTokens || 0,
        completionTokens: usage.completionTokens || 0,
        totalTokens: usage.totalTokens || 0,
        costUsd,
        costSar,
        credits,
    });
}

// Prompt templates with guardrails
export const PROMPT_TEMPLATES = {
    bulletGenerator: `You are a professional resume writer helping to create impactful achievement bullet points for a CV/resume.

RULES:
- ALWAYS generate 4-5 bullet points regardless of provided context
- Start each bullet with a strong action verb (Led, Managed, Developed, Achieved, Improved, etc.)
- Include realistic quantifiable results (%, $, numbers) based on typical role outcomes
- Keep each bullet to 1-2 lines maximum
- Focus on achievements and impact, not just responsibilities
- Make bullets specific to the role and industry
- Use professional language suitable for ATS systems

User's context:
{{context}}

Generate exactly 5 achievement-focused bullet points. Return ONLY a JSON array of 5 strings, no explanations or markdown.
Example format: ["Led team of 5 engineers...", "Improved process efficiency by 30%...", ...]`,

    summaryGenerator: `You are a professional resume writer helping to create an impactful professional summary.

RULES:
- Keep it 2-4 sentences
- Highlight the candidate's value proposition (impact + specialization)
- Mention years of experience, key skills, and notable achievements
- Avoid first-person pronouns (I, me, my)
- Be truthful - NEVER invent qualifications
- If a target role is provided, lead with it in the first sentence
- Tailor keywords and strengths to the target role
- Label your suggestions clearly as AI-generated

User's context:
{{context}}

Generate a professional summary. Return only the summary text, no additional formatting.`,

    skillsExtractor: `Extract relevant skills from the following job description.

RULES:
- Include both technical and soft skills
- Categorize as: Technical Skills, Soft Skills, Tools, Certifications
- Return as JSON object with categories as keys and arrays of skills as values
- Only include skills explicitly mentioned

Job Description:
{{jobDescription}}`,

    coverLetterGenerator: `Write a professional cover letter based on the resume and job description.

RULES:
- Keep it to 3-4 paragraphs
- Connect the candidate's experience to the job requirements
- Be truthful - NEVER invent qualifications
- Use professional but personable tone
- Include a call to action

Resume Summary:
{{resumeSummary}}

Job Description:
{{jobDescription}}

Company Name: {{companyName}}
Position: {{position}}`,

    matchAnalysis: `Analyze how well this resume matches the job description.

RULES:
- Calculate a match percentage (0-100)
- Identify matching keywords and skills
- Identify missing keywords that should be added
- Suggest specific improvements
- Be objective and factual

Resume:
{{resume}}

Job Description:
{{jobDescription}}

Return analysis as JSON with: matchScore, matchingKeywords, missingKeywords, suggestions`,

    questionGenerator: `Based on this experience entry, generate clarifying questions to improve the bullet points.

RULES:
- Ask about specific metrics and outcomes
- Ask about scope (team size, budget, timeline)
- Ask about tools and technologies used
- Ask about challenges overcome
- Keep questions specific and actionable

Experience Entry:
{{experience}}

Generate 3-5 questions as a JSON array of strings.`,
};

class AIClient {
    private provider: AIProvider;
    private requestTimeoutMs = 20000;
    private maxRetries = 2;

    constructor() {
        this.provider = (process.env.AI_PROVIDER as AIProvider) || 'openai';
    }

    private getOpenAIKey(): string {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        return apiKey;
    }

    private getAnthropicKey(): string {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is not configured');
        }
        return apiKey;
    }

    private getGoogleKey(): string {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_AI_API_KEY is not configured');
        }
        return apiKey;
    }

    getProvider(): AIProvider {
        return this.provider;
    }

    async complete(
        messages: AIMessage[],
        options: AICompletionOptions = {}
    ): Promise<AIResponse> {
        const { temperature = 0.7, maxTokens = 1000 } = options;

        switch (this.provider) {
            case 'openai':
                return this.completeOpenAI(messages, temperature, maxTokens);
            case 'anthropic':
                return this.completeAnthropic(messages, temperature, maxTokens);
            case 'google':
                return this.completeGoogle(messages, temperature, maxTokens);
            default:
                throw new Error(`Unsupported AI provider: ${this.provider}`);
        }
    }

    private async completeOpenAI(
        messages: AIMessage[],
        temperature: number,
        maxTokens: number
    ): Promise<AIResponse> {
        const apiKey = this.getOpenAIKey();
        const response = await this.fetchWithRetry('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                temperature,
                max_tokens: maxTokens,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            },
        };
    }

    private async completeAnthropic(
        messages: AIMessage[],
        temperature: number,
        maxTokens: number
    ): Promise<AIResponse> {
        const apiKey = this.getAnthropicKey();
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');

        const response = await this.fetchWithRetry('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2024-01-01',
            },
            body: JSON.stringify({
                model: 'claude-3-opus-20240229',
                max_tokens: maxTokens,
                temperature,
                system: systemMessage?.content,
                messages: userMessages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content,
                })),
            }),
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.content[0].text,
            usage: {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            },
        };
    }

    private async completeGoogle(
        messages: AIMessage[],
        temperature: number,
        maxTokens: number
    ): Promise<AIResponse> {
        const apiKey = this.getGoogleKey();
        const response = await this.fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: messages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }],
                    })),
                    generationConfig: {
                        temperature,
                        maxOutputTokens: maxTokens,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Google AI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            content: data.candidates[0].content.parts[0].text,
        };
    }

    // Helper method to fill prompt templates
    static fillTemplate(template: string, variables: Record<string, string>): string {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return result;
    }

    private async fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                });

                if (!response.ok && this.shouldRetry(response.status) && attempt < this.maxRetries) {
                    await this.sleep(this.getBackoffMs(attempt));
                    continue;
                }

                return response;
            } catch (error) {
                if (attempt >= this.maxRetries) {
                    throw error;
                }
                await this.sleep(this.getBackoffMs(attempt));
            } finally {
                clearTimeout(timeout);
            }
        }

        throw new Error('AI request failed');
    }

    private shouldRetry(status: number): boolean {
        return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
    }

    private getBackoffMs(attempt: number): number {
        return 500 * Math.pow(2, attempt);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const aiClient = new AIClient();

// Convenience functions for common operations
export async function generateBulletPoints(
    company: string,
    position: string,
    description: string,
    existingBullets: string[] = [],
    tracking?: AITracking
): Promise<string[]> {
    const context = `
Company: ${company || 'A professional company'}
Position: ${position || 'Professional role'}
Description: ${description || 'Standard professional responsibilities'}
${existingBullets.length > 0 ? `Existing bullets to avoid duplicating:\n${existingBullets.join('\n')}` : ''}
`;

    const response = await aiClient.complete([
        {
            role: 'system',
            content: AIClient.fillTemplate(PROMPT_TEMPLATES.bulletGenerator, { context }),
        },
        {
            role: 'user',
            content: `Generate 5 achievement bullet points for a ${position || 'professional'} at ${company || 'a company'}.`,
        },
    ]);

    await recordAIUsage(tracking, response.usage, aiClient.getProvider());

    // Parse JSON response
    try {
        // Try to extract JSON array from response
        let content = response.content.trim();

        // Remove markdown code blocks if present
        if (content.includes('```')) {
            const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match) content = match[1].trim();
        }

        // Find JSON array in content
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            const parsed = JSON.parse(arrayMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.filter(item => typeof item === 'string' && item.trim().length > 0);
            }
        }
    } catch {
        // JSON parsing failed, try text parsing
    }

    // Fallback: Parse as text with bullet points or numbered list
    const lines = response.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10) // Filter out short lines
        .map(line => line.replace(/^[-•*\d.)\]]+\s*/, '').trim()) // Remove bullet/number prefixes
        .filter(line => line.length > 0);

    if (lines.length > 0) {
        return lines.slice(0, 5); // Return up to 5 bullets
    }

    // Ultimate fallback: return a generic bullet based on the position
    return [
        `Managed key responsibilities and delivered results as ${position || 'a professional'}`,
        `Collaborated with cross-functional teams to achieve organizational objectives`,
        `Improved processes and workflows to enhance operational efficiency`,
        `Contributed to team success through problem-solving and initiative`,
    ];
}

export async function generateSummary(
    experience: any[],
    skills: string[],
    targetRole?: string,
    tracking?: AITracking
): Promise<string> {
    const recentExperience = experience
        .filter((item) => item && (item.position || item.company))
        .slice(0, 3)
        .map((item) => {
            const position = item.position || '';
            const company = item.company || '';
            const header = [position, company].filter(Boolean).join(' at ') || 'Role';
            const bullets = Array.isArray(item.bullets)
                ? item.bullets.map((bullet: any) => typeof bullet === 'string' ? bullet : bullet?.content)
                : [];
            const highlights = bullets.filter(Boolean).slice(0, 2).join('; ');
            const description = typeof item.description === 'string' ? item.description : '';
            const summary = highlights || description;
            const trimmed = summary.length > 160 ? `${summary.slice(0, 157)}...` : summary;
            return trimmed ? `${header}: ${trimmed}` : header;
        })
        .filter(Boolean);
    const normalizedSkills = Array.from(
        new Set(skills.map((skill) => skill.trim()).filter(Boolean))
    ).slice(0, 12);
    const context = `
Experience entries: ${experience.length}
Recent roles:
${recentExperience.length ? `- ${recentExperience.join('\n- ')}` : 'Not provided'}
Key skills: ${normalizedSkills.length ? normalizedSkills.join(', ') : 'Not provided'}
Target role: ${targetRole || 'Not specified'}
`;

    const response = await aiClient.complete([
        {
            role: 'system',
            content: AIClient.fillTemplate(PROMPT_TEMPLATES.summaryGenerator, { context }),
        },
        {
            role: 'user',
            content: 'Generate a professional summary.',
        },
    ]);

    await recordAIUsage(tracking, response.usage, aiClient.getProvider());
    return response.content.trim();
}

export async function analyzeJobMatch(
    resume: any,
    jobDescription: string,
    tracking?: AITracking
): Promise<{
    matchScore: number;
    matchingKeywords: string[];
    missingKeywords: string[];
    suggestions: string[];
}> {
    const response = await aiClient.complete([
        {
            role: 'system',
            content: AIClient.fillTemplate(PROMPT_TEMPLATES.matchAnalysis, {
                resume: JSON.stringify(resume, null, 2),
                jobDescription,
            }),
        },
        {
            role: 'user',
            content: 'Analyze the match.',
        },
    ]);

    await recordAIUsage(tracking, response.usage, aiClient.getProvider());

    try {
        // Extract JSON - strip markdown code blocks if present
        let jsonStr = response.content.trim();
        if (jsonStr.includes('```')) {
            const m = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (m) jsonStr = m[1].trim();
        }
        const objM = jsonStr.match(/\{[\s\S]*\}/);
        if (objM) jsonStr = objM[0];
        const p = JSON.parse(jsonStr);
        return {
            matchScore: typeof p.matchScore === 'number' ? p.matchScore : 50,
            matchingKeywords: Array.isArray(p.matchingKeywords) ? p.matchingKeywords : [],
            missingKeywords: Array.isArray(p.missingKeywords) ? p.missingKeywords : [],
            suggestions: Array.isArray(p.suggestions) ? p.suggestions : [],
        };
    } catch {
        return {
            matchScore: 50,
            matchingKeywords: [],
            missingKeywords: [],
            suggestions: ['Unable to parse analysis. Please try again.'],
        };
    }
}

export async function generateCoverLetter(
    resumeSummary: string,
    jobDescription: string,
    companyName: string,
    position: string,
    tracking?: AITracking
): Promise<string> {
    const response = await aiClient.complete([
        {
            role: 'system',
            content: AIClient.fillTemplate(PROMPT_TEMPLATES.coverLetterGenerator, {
                resumeSummary,
                jobDescription,
                companyName,
                position,
            }),
        },
        {
            role: 'user',
            content: 'Generate the cover letter.',
        },
    ]);

    await recordAIUsage(tracking, response.usage, aiClient.getProvider());
    return response.content.trim();
}

export async function extractSkillsFromJobDescription(
    jobDescription: string,
    tracking?: AITracking
): Promise<string[]> {
    const response = await aiClient.complete([
        {
            role: 'system',
            content: AIClient.fillTemplate(PROMPT_TEMPLATES.skillsExtractor, {
                jobDescription,
            }),
        },
        {
            role: 'user',
            content: 'Extract relevant skills.',
        },
    ]);

    await recordAIUsage(tracking, response.usage, aiClient.getProvider());

    try {
        const parsed = JSON.parse(response.content);
        if (Array.isArray(parsed)) {
            return parsed.filter((skill) => typeof skill === 'string' && skill.trim().length > 0);
        }

        if (parsed && typeof parsed === 'object') {
            const values = Object.values(parsed).flat();
            const skills = values.filter(
                (skill): skill is string => typeof skill === 'string' && skill.trim().length > 0
            );
            return Array.from(new Set(skills));
        }
    } catch {
        // Fall through to basic parsing below.
    }

    return response.content
        .split('\n')
        .map((line) => line.replace(/^[-*\d.]\s*/, '').trim())
        .filter((line) => line.length > 0);
}

