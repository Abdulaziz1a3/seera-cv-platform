// OpenAI Integration for Seera AI
// Provides AI-powered content generation for resumes

import OpenAI from 'openai';

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

// Get or create OpenAI client (lazy initialization for serverless)
export function getOpenAI(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured. Please set it in your environment variables.');
        }
        openaiClient = new OpenAI({
            apiKey,
        });
    }
    return openaiClient;
}

// Lazy getter for OpenAI client (only initialized when actually used)
function getOpenAIClient(): OpenAI {
    return getOpenAI();
}

export interface AIContentOptions {
    targetRole?: string;
    industry?: string;
    yearsExperience?: number;
    locale?: 'ar' | 'en';
    tone?: 'professional' | 'confident' | 'creative';
}

// Generate professional summary
export async function generateSummary(options: AIContentOptions): Promise<string> {
    const { targetRole = 'professional', yearsExperience = 3, locale = 'ar', tone = 'professional' } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير في كتابة السير الذاتية للسوق السعودي والخليجي. اكتب ملخصات مهنية قوية ومختصرة وحقيقية. استخدم أفعال قوية وأرقام محددة عند الإمكان. يجب أن يكون الملخص 3-4 جمل فقط. اللهجة: ${tone === 'confident' ? 'واثقة' : tone === 'creative' ? 'إبداعية' : 'مهنية'}.`
        : `You are an expert CV writer for the Saudi/GCC market. Write powerful, concise, and authentic professional summaries. Use strong action verbs and specific numbers when possible. Summary should be 3-4 sentences only. Tone: ${tone}.`;

    const userPrompt = locale === 'ar'
        ? `اكتب ملخصاً مهنياً لشخص يعمل كـ "${targetRole}" مع ${yearsExperience} سنوات خبرة. الملخص يجب أن يكون مناسباً للسوق السعودي/الخليجي.`
        : `Write a professional summary for someone working as "${targetRole}" with ${yearsExperience} years of experience. The summary should be suitable for the Saudi/GCC market.`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
}

// Generate experience bullet points
export async function generateBullets(
    position: string,
    company: string,
    options: AIContentOptions = {}
): Promise<string[]> {
    const { industry = '', locale = 'ar' } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير في كتابة نقاط الإنجازات للسير الذاتية. اكتب 4-5 نقاط قوية تبدأ بأفعال وتتضمن أرقاماً وإنجازات محددة. كل نقطة يجب أن تكون جملة واحدة مختصرة.`
        : `You are an expert CV bullet point writer. Write 4-5 powerful bullet points that start with action verbs and include specific numbers and achievements. Each bullet should be one concise sentence.`;

    const userPrompt = locale === 'ar'
        ? `اكتب نقاط إنجازات لشخص عمل كـ "${position}" في شركة "${company}"${industry ? ` في مجال ${industry}` : ''}.`
        : `Write achievement bullet points for someone who worked as "${position}" at "${company}"${industry ? ` in the ${industry} industry` : ''}.`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    return content.split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•*]\s*/, '').trim());
}

// Generate skill suggestions
export async function suggestSkills(
    targetRole: string,
    existingSkills: string[] = [],
    options: AIContentOptions = {}
): Promise<string[]> {
    const { locale = 'ar' } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير في سوق العمل السعودي والخليجي. اقترح المهارات الأكثر طلباً والمتوافقة مع أنظمة ATS.`
        : `You are a Saudi/GCC job market expert. Suggest the most in-demand skills that are ATS-compatible.`;

    const userPrompt = locale === 'ar'
        ? `اقترح 10 مهارات مطلوبة لمنصب "${targetRole}"${existingSkills.length ? `. المهارات الموجودة: ${existingSkills.join(', ')}. لا تكرر الموجودة.` : '.'}`
        : `Suggest 10 in-demand skills for a "${targetRole}" position${existingSkills.length ? `. Existing skills: ${existingSkills.join(', ')}. Don't repeat existing ones.` : '.'}`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 200,
        temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content || '';
    return content.split('\n')
        .map(line => line.replace(/^[\d.-•*]\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 50);
}

// Improve existing content
export async function improveContent(
    content: string,
    type: 'summary' | 'bullet' | 'description' | 'fix_grammar' | 'make_concise' | 'make_professional',
    options: AIContentOptions = {}
): Promise<string> {
    const { locale = 'ar' } = options;

    const instructions: Record<string, { ar: string; en: string }> = {
        summary: {
            ar: 'حسّن هذا الملخص المهني ليكون أقوى وأكثر تأثيراً. اجعله مختصراً وأضف أفعالاً قوية.',
            en: 'Improve this professional summary to be stronger and more impactful. Keep it concise and add power verbs.',
        },
        bullet: {
            ar: 'حسّن هذه النقطة لتبدأ بفعل قوي وتتضمن أرقاماً إن أمكن.',
            en: 'Improve this bullet point to start with a strong action verb and include numbers if possible.',
        },
        description: {
            ar: 'حسّن هذا الوصف ليكون أكثر احترافية ومناسباً للسوق السعودي.',
            en: 'Improve this description to be more professional and suitable for the Saudi market.',
        },
        fix_grammar: {
            ar: 'صحح الأخطاء اللغوية والنحوية في هذا النص فقط دون تغيير المعنى.',
            en: 'Fix grammar and spelling errors in this text without changing the meaning.',
        },
        make_concise: {
            ar: 'اختصر هذا النص واجعله مباشراً وواضحاً.',
            en: 'Make this text more concise, direct, and clear.',
        },
        make_professional: {
            ar: 'أعد صياغة هذا النص بأسلوب مهني رسمي.',
            en: 'Rewrite this text in a formal, professional tone.',
        }
    };

    const promptKey = instructions[type] ? type : 'description';
    const prompt = locale === 'ar' ? instructions[promptKey].ar : instructions[promptKey].en;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: content },
        ],
        max_tokens: 300,
        temperature: 0.4,
    });

    return response.choices[0]?.message?.content || content;
}

// Analyze job description and extract keywords
export async function analyzeJobDescription(
    jobDescription: string,
    locale: 'ar' | 'en' = 'ar'
): Promise<{
    keywords: string[];
    requirements: string[];
    suggestedSkills: string[];
}> {
    const systemPrompt = locale === 'ar'
        ? `حلل وصف الوظيفة واستخرج: 1) الكلمات المفتاحية المهمة للـ ATS 2) المتطلبات الأساسية 3) المهارات المقترحة للسيرة الذاتية. أجب بصيغة JSON.`
        : `Analyze the job description and extract: 1) Important ATS keywords 2) Core requirements 3) Suggested skills for the resume. Reply in JSON format.`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: jobDescription },
        ],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    try {
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
            keywords: result.keywords || [],
            requirements: result.requirements || [],
            suggestedSkills: result.suggestedSkills || result.suggested_skills || [],
        };
    } catch {
        return { keywords: [], requirements: [], suggestedSkills: [] };
    }
}

// Generate cover letter
export async function generateCoverLetter(
    resumeData: {
        name: string;
        targetRole: string;
        experience: { position: string; company: string }[];
        skills: string[];
    },
    jobDescription: string,
    options: AIContentOptions = {}
): Promise<string> {
    const { locale = 'ar', tone = 'professional' } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير في كتابة رسائل التغطية للسوق السعودي والخليجي. اكتب رسالة مختصرة (3 فقرات) ومقنعة تربط خبرات المتقدم بمتطلبات الوظيفة.`
        : `You are an expert cover letter writer for the Saudi/GCC market. Write a concise (3 paragraphs) and compelling letter that connects the applicant's experience to the job requirements.`;

    const userPrompt = locale === 'ar'
        ? `اكتب رسالة تغطية لـ ${resumeData.name} الذي يتقدم لمنصب ${resumeData.targetRole}. خبراته: ${resumeData.experience.map(e => `${e.position} في ${e.company}`).join(', ')}. مهاراته: ${resumeData.skills.join(', ')}.\n\nوصف الوظيفة:\n${jobDescription}`
        : `Write a cover letter for ${resumeData.name} applying for ${resumeData.targetRole}. Experience: ${resumeData.experience.map(e => `${e.position} at ${e.company}`).join(', ')}. Skills: ${resumeData.skills.join(', ')}.\n\nJob Description:\n${jobDescription}`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
}

// Calculate ATS optimization score
export async function calculateATSScore(
    resumeText: string,
    jobDescription?: string
): Promise<{
    score: number;
    issues: { severity: 'high' | 'medium' | 'low'; issue: string; fix: string }[];
}> {
    const systemPrompt = `You are an ATS expert. Analyze this resume for ATS compatibility. Return JSON with: score (0-100), issues array with objects containing: severity ("high"/"medium"/"low"), issue description, and fix suggestion.`;

    const prompt = jobDescription
        ? `Analyze this resume against the job description.\n\nResume:\n${resumeText}\n\nJob Description:\n${jobDescription}`
        : `Analyze this resume for ATS compatibility.\n\nResume:\n${resumeText}`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    try {
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
            score: result.score || 50,
            issues: result.issues || [],
        };
    } catch {
        return { score: 50, issues: [] };
    }
}
