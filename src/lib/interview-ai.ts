// AI Interview Service
// Handles interview question generation, conversation, and feedback

import { getOpenAI } from '@/lib/openai';
import { calculateChatCostUsd, calculateCreditsFromUsd, calculateTtsCostUsd, recordAICreditUsage } from '@/lib/ai-credits';

export type InterviewLocale = 'ar' | 'en' | 'ar-sa';

export interface InterviewContext {
    userId?: string;
    targetRole: string;
    industry?: string;
    experienceLevel: 'junior' | 'mid' | 'senior' | 'executive';
    resumeSummary?: string;
    skills?: string[];
    locale?: InterviewLocale;
    dialect?: 'saudi_casual' | 'formal' | 'gulf' | string;
}

export interface InterviewQuestion {
    id: string;
    question: string;
    category: 'behavioral' | 'technical' | 'situational' | 'experience' | 'culture';
    difficulty: 'easy' | 'medium' | 'hard';
    tips?: string;
    sampleAnswer?: string;
}

export interface InterviewFeedback {
    score: number; // 1-10
    strengths: string[];
    improvements: string[];
    starMethodScore: {
        situation: number;
        task: number;
        action: number;
        result: number;
    };
    revisedAnswer?: string;
}

const FALLBACK_QUESTIONS_EN = [
    { question: 'Why are you interested in this role?', category: 'behavioral', difficulty: 'easy' },
    { question: 'Tell me about a professional achievement you are proud of.', category: 'experience', difficulty: 'medium' },
    { question: 'Describe a time you worked under pressure and how you handled it.', category: 'situational', difficulty: 'medium' },
    { question: 'How do you prioritize when you have multiple urgent tasks?', category: 'situational', difficulty: 'medium' },
    { question: 'Walk me through a problem you solved and your approach.', category: 'technical', difficulty: 'medium' },
    { question: 'Tell me about a time you received feedback and what you did with it.', category: 'behavioral', difficulty: 'easy' },
    { question: 'Describe a project where you collaborated with others.', category: 'experience', difficulty: 'easy' },
    { question: 'What makes you a strong fit for this position?', category: 'culture', difficulty: 'easy' },
    { question: 'How do you learn new tools or skills quickly?', category: 'behavioral', difficulty: 'medium' },
    { question: 'What are your main strengths and areas for improvement?', category: 'behavioral', difficulty: 'medium' },
    { question: 'Share an example of leadership or ownership you demonstrated.', category: 'experience', difficulty: 'hard' },
    { question: 'What do you expect from your manager and team?', category: 'culture', difficulty: 'easy' },
] as const;

const FALLBACK_QUESTIONS_AR = [
    { question: 'لماذا ترغب في هذه الوظيفة؟', category: 'behavioral', difficulty: 'easy' },
    { question: 'حدثني عن إنجاز مهني تفخر به.', category: 'experience', difficulty: 'medium' },
    { question: 'صف موقفاً تعاملت فيه مع ضغط العمل وكيف تعاملت معه.', category: 'situational', difficulty: 'medium' },
    { question: 'كيف ترتب أولوياتك عندما تتراكم المهام؟', category: 'situational', difficulty: 'medium' },
    { question: 'اشرح مشكلة واجهتها وكيف قمت بحلها.', category: 'technical', difficulty: 'medium' },
    { question: 'كيف تتعامل مع الملاحظات أو النقد البنّاء؟', category: 'behavioral', difficulty: 'easy' },
    { question: 'صف مشروعاً عملت عليه ضمن فريق وما كان دورك.', category: 'experience', difficulty: 'easy' },
    { question: 'ما الذي يجعلك مناسباً لهذا الدور؟', category: 'culture', difficulty: 'easy' },
    { question: 'كيف تتعلم مهارة أو أداة جديدة بسرعة؟', category: 'behavioral', difficulty: 'medium' },
    { question: 'ما هي أبرز نقاط قوتك ومجالات التحسين لديك؟', category: 'behavioral', difficulty: 'medium' },
    { question: 'أعط مثالاً على موقف أظهرت فيه قيادة أو مبادرة.', category: 'experience', difficulty: 'hard' },
    { question: 'ما توقعاتك من المدير والفريق؟', category: 'culture', difficulty: 'easy' },
] as const;

async function recordInterviewUsage(params: {
    userId?: string;
    model: string;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    operation: string;
}): Promise<void> {
    if (!params.userId || !params.usage?.total_tokens) return;

    const promptTokens = params.usage.prompt_tokens || 0;
    const completionTokens = params.usage.completion_tokens || 0;
    const totalTokens = params.usage.total_tokens || 0;
    const costUsd = calculateChatCostUsd({
        model: params.model,
        promptTokens,
        completionTokens,
    });
    const { costSar, credits } = calculateCreditsFromUsd(costUsd);

    await recordAICreditUsage({
        userId: params.userId,
        provider: 'openai',
        model: params.model,
        operation: params.operation,
        promptTokens,
        completionTokens,
        totalTokens,
        costUsd,
        costSar,
        credits,
    });
}

function getLocaleProfile(locale?: InterviewLocale, dialect?: string) {
    const normalized = (locale || 'en').toLowerCase();
    const isArabic = normalized.startsWith('ar');
    const isSaudiDialect = normalized === 'ar-sa' || dialect === 'saudi_casual';
    return { isArabic, isSaudiDialect };
}

function normalizeCount(count: number): number {
    if (!Number.isFinite(count) || count <= 0) return 10;
    return Math.min(Math.max(Math.round(count), 1), 20);
}

function buildFallbackQuestions(context: InterviewContext, count: number): InterviewQuestion[] {
    const { isArabic } = getLocaleProfile(context.locale, context.dialect);
    const source = isArabic ? FALLBACK_QUESTIONS_AR : FALLBACK_QUESTIONS_EN;

    return Array.from({ length: count }).map((_, index) => {
        const seed = source[index % source.length];
        return {
            id: `fallback-${index + 1}`,
            question: seed.question.replace('{role}', context.targetRole),
            category: seed.category,
            difficulty: seed.difficulty,
        };
    });
}

function coerceQuestions(
    questions: any[],
    context: InterviewContext,
    count: number
): InterviewQuestion[] {
    const normalized: InterviewQuestion[] = questions
        .map((q: any, i: number) => ({
            id: q?.id || `q-${i + 1}`,
            question: q?.question || q?.text || q,
            category: q?.category || 'behavioral',
            difficulty: q?.difficulty || 'medium',
            tips: q?.tips || '',
        }))
        .filter((q) => typeof q.question === 'string' && q.question.trim().length > 0);

    if (normalized.length >= count) return normalized.slice(0, count);

    const fallback = buildFallbackQuestions(context, count);
    const existing = new Set(normalized.map((q) => q.question.trim().toLowerCase()));

    for (const candidate of fallback) {
        if (existing.has(candidate.question.trim().toLowerCase())) continue;
        normalized.push(candidate);
        if (normalized.length >= count) break;
    }

    return normalized.slice(0, count);
}

// Generate interview questions based on role and resume
export async function generateInterviewQuestions(
    context: InterviewContext,
    count: number = 10
): Promise<InterviewQuestion[]> {
    const { targetRole, industry, experienceLevel, resumeSummary, skills, locale = 'en', dialect } = context;
    const safeCount = normalizeCount(count);
    const { isArabic, isSaudiDialect } = getLocaleProfile(locale, dialect);

    const systemPrompt = isArabic
        ? isSaudiDialect
            ? `أنت مسؤول توظيف سعودي تجري مقابلة ودية احترافية. استخدم لهجة سعودية ودية وطبيعية بدون لغة سوقية.`
            : `أنت خبير توظيف في سوق العمل السعودي والخليجي. أنشئ أسئلة مقابلة واقعية ومحترفة باللغة العربية الفصحى.`
        : `You are a hiring expert for the Saudi/GCC job market. Generate realistic, professional interview questions.`;

    const userPrompt = isArabic
        ? `أنشئ ${safeCount} سؤال مقابلة لمنصب "${targetRole}" في مجال ${industry || 'عام'}.
مستوى الخبرة: ${experienceLevel === 'junior' ? 'مبتدئ' : experienceLevel === 'mid' ? 'متوسط' : experienceLevel === 'senior' ? 'متقدم' : 'تنفيذي'}
${resumeSummary ? `ملخص السيرة الذاتية: ${resumeSummary}` : ''}
${skills?.length ? `المهارات: ${skills.join(', ')}` : ''}

اكتب الأسئلة ${isSaudiDialect ? 'باللهجة السعودية العامية الودية' : 'بالعربية الفصحى'}.
أنشئ أسئلة متنوعة: سلوكية، تقنية، ظرفية، عن الخبرة، والثقافة.
أجب بصيغة JSON مع: id, question, category, difficulty, tips.`
        : `Generate ${safeCount} interview questions for a "${targetRole}" position in ${industry || 'general'} industry.
Experience level: ${experienceLevel}
${resumeSummary ? `Resume summary: ${resumeSummary}` : ''}
${skills?.length ? `Skills: ${skills.join(', ')}` : ''}

Generate diverse questions: behavioral, technical, situational, experience, and culture fit.
Reply in JSON format with: id, question, category, difficulty, tips.`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.8,
        response_format: { type: 'json_object' },
    });

    await recordInterviewUsage({
        userId: context.userId,
        model: 'gpt-4o-mini',
        usage: response.usage,
        operation: 'interview_questions',
    });

    try {
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        // Handle different response formats
        const questions = result.questions || result.interview_questions || Object.values(result).find(v => Array.isArray(v)) || [];

        if (Array.isArray(questions) && questions.length > 0) {
            return coerceQuestions(questions, context, safeCount);
        }

        // Fallback questions if AI fails
        return buildFallbackQuestions(context, safeCount);
    } catch (error) {
        console.error('Failed to parse interview questions:', error);
        return buildFallbackQuestions(context, safeCount);
    }
}

// Conduct live interview conversation
export async function conductInterview(
    messages: Array<{ role: 'interviewer' | 'candidate'; content: string }>,
    context: InterviewContext,
    currentQuestion: string,
    nextQuestion?: string
): Promise<string> {
    const { targetRole, locale = 'en', dialect } = context;
    const { isArabic, isSaudiDialect } = getLocaleProfile(locale, dialect);

    const transitionInstruction = nextQuestion
        ? isArabic
            ? `اختم بإلقاء السؤال التالي حرفياً: "${nextQuestion}"`
            : `End by asking this exact next question: "${nextQuestion}"`
        : isArabic
            ? 'اختم بسؤال قصير إن كان لدى المرشح أي أسئلة.'
            : 'End by asking if the candidate has any questions.';

    const languageInstruction = isArabic
        ? isSaudiDialect
            ? 'استخدم لهجة سعودية ودية طبيعية بدون مبالغة.'
            : 'استخدم العربية الفصحى.'
        : 'Use clear, professional English.';

    const systemPrompt = isArabic
        ? `أنت مدير توظيف محترف تجري مقابلة لمنصب "${targetRole}".
- كن ودوداً لكن محترفاً
- اطرح أسئلة متابعة ذكية بناءً على إجابات المرشح
- لا تكرر الأسئلة
- تصرف كمحاور حقيقي، ليس روبوت
- ردودك قصيرة ومختصرة (جملة أو جملتين)
- ${languageInstruction}
- ${transitionInstruction}`
        : `You are a professional hiring manager conducting an interview for "${targetRole}" position.
- Be friendly but professional
- Ask smart follow-up questions based on candidate responses
- Don't repeat questions
- Act like a real interviewer, not a robot
- Keep responses short (1-2 sentences)
- ${languageInstruction}
- ${transitionInstruction}`;

    const formattedMessages = messages.map((m) => ({
        role: m.role === 'interviewer' ? 'assistant' : 'user',
        content: m.content,
    }));

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'assistant', content: currentQuestion },
            ...formattedMessages,
        ] as any,
        max_tokens: 200,
        temperature: 0.7,
    });

    await recordInterviewUsage({
        userId: context.userId,
        model: 'gpt-4o-mini',
        usage: response.usage,
        operation: 'interview_conduct',
    });

    return response.choices[0]?.message?.content || '';
}

// Evaluate candidate's answer
export async function evaluateAnswer(
    question: string,
    answer: string,
    context: InterviewContext
): Promise<InterviewFeedback> {
    const { locale = 'en', dialect } = context;
    const { isArabic, isSaudiDialect } = getLocaleProfile(locale, dialect);

    const systemPrompt = isArabic
        ? isSaudiDialect
            ? `أنت خبير مقابلات. قيّم إجابة المرشح بمنهجية STAR وبأسلوب سعودي ودود.`
            : `أنت خبير مقابلات. قيّم إجابة المرشح باستخدام منهجية STAR. أعطِ تقييماً صادقاً وبنّاءً.`
        : `You are an interview expert. Evaluate the candidate's answer using the STAR method. Give honest, constructive feedback.`;

    const userPrompt = isArabic
        ? `السؤال: ${question}
إجابة المرشح: ${answer}

قيّم الإجابة وأجب بصيغة JSON:
{
  "score": (1-10),
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "improvements": ["اقتراح 1", "اقتراح 2"],
  "starMethodScore": {
    "situation": (1-10),
    "task": (1-10),
    "action": (1-10),
    "result": (1-10)
  },
  "revisedAnswer": "إجابة محسّنة مقترحة"
}`
        : `Question: ${question}
Candidate's answer: ${answer}

Evaluate the answer and reply in JSON format:
{
  "score": (1-10),
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["suggestion 1", "suggestion 2"],
  "starMethodScore": {
    "situation": (1-10),
    "task": (1-10),
    "action": (1-10),
    "result": (1-10)
  },
  "revisedAnswer": "improved suggested answer"
}`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.5,
        response_format: { type: 'json_object' },
    });

    await recordInterviewUsage({
        userId: context.userId,
        model: 'gpt-4o-mini',
        usage: response.usage,
        operation: 'interview_evaluate',
    });

    try {
        const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
        const score = Number.isFinite(parsed.score) ? parsed.score : 5;
        return {
            score,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
            starMethodScore: parsed.starMethodScore || {
                situation: 5,
                task: 5,
                action: 5,
                result: 5,
            },
            revisedAnswer: parsed.revisedAnswer,
        };
    } catch {
        return {
            score: 5,
            strengths: [],
            improvements: [],
            starMethodScore: { situation: 5, task: 5, action: 5, result: 5 },
        };
    }
}

// Generate text-to-speech audio for interviewer
export async function generateInterviewerVoice(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'onyx',
    userId?: string
): Promise<ArrayBuffer> {
    const response = await getOpenAI().audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        speed: 1.0,
    });

    if (userId) {
        const costUsd = calculateTtsCostUsd({ model: 'tts-1', text });
        const { costSar, credits } = calculateCreditsFromUsd(costUsd);
        await recordAICreditUsage({
            userId,
            provider: 'openai',
            model: 'tts-1',
            operation: 'interview_tts',
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            costUsd,
            costSar,
            credits,
            inputChars: text.length,
        });
    }

    return response.arrayBuffer();
}

// Transcribe user's spoken answer
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
    });

    const result = await response.json();
    return result.text || '';
}

// Generate interview summary
export async function generateInterviewSummary(
    questions: Array<{ question: string; answer: string; score: number }>,
    context: InterviewContext
): Promise<{
    overallScore: number;
    summary: string;
    topStrength: string;
    topImprovement: string;
    readinessLevel: 'not_ready' | 'needs_practice' | 'ready' | 'excellent';
}> {
    const { locale = 'en', dialect } = context;
    const { isArabic, isSaudiDialect } = getLocaleProfile(locale, dialect);
    const avgScore = questions.length > 0
        ? questions.reduce((sum, q) => sum + q.score, 0) / questions.length
        : 0;

    const systemPrompt = isArabic
        ? isSaudiDialect
            ? `أنت مستشار مهني. لخّص أداء المرشح في المقابلة التدريبية بأسلوب سعودي ودود.`
            : `أنت مستشار مهني. لخّص أداء المرشح في المقابلة التدريبية.`
        : `You are a career coach. Summarize the candidate's mock interview performance.`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `Interview results:\n${questions.map((q, i) => `Q${i + 1}: ${q.question}\nA: ${q.answer}\nScore: ${q.score}/10`).join('\n\n')}\n\nProvide JSON summary with: summary, topStrength, topImprovement`,
            },
        ],
        max_tokens: 400,
        response_format: { type: 'json_object' },
    });

    await recordInterviewUsage({
        userId: context.userId,
        model: 'gpt-4o-mini',
        usage: response.usage,
        operation: 'interview_summary',
    });

    try {
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');

        return {
            overallScore: Math.round(avgScore * 10) / 10,
            summary: result.summary || '',
            topStrength: result.topStrength || '',
            topImprovement: result.topImprovement || '',
            readinessLevel:
                avgScore >= 8 ? 'excellent' : avgScore >= 6 ? 'ready' : avgScore >= 4 ? 'needs_practice' : 'not_ready',
        };
    } catch {
        return {
            overallScore: Math.round(avgScore * 10) / 10,
            summary: '',
            topStrength: '',
            topImprovement: '',
            readinessLevel:
                avgScore >= 8 ? 'excellent' : avgScore >= 6 ? 'ready' : avgScore >= 4 ? 'needs_practice' : 'not_ready',
        };
    }
}
