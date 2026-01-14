// AI Interview Service
// Handles interview question generation, conversation, and feedback

import { getOpenAI } from '@/lib/openai';

export interface InterviewContext {
    targetRole: string;
    industry?: string;
    experienceLevel: 'junior' | 'mid' | 'senior' | 'executive';
    resumeSummary?: string;
    skills?: string[];
    locale?: 'ar' | 'en';
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

// Generate interview questions based on role and resume
export async function generateInterviewQuestions(
    context: InterviewContext,
    count: number = 10
): Promise<InterviewQuestion[]> {
    const { targetRole, industry, experienceLevel, resumeSummary, skills, locale = 'en' } = context;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير توظيف في سوق العمل السعودي والخليجي. أنشئ أسئلة مقابلة واقعية ومحترفة.`
        : `You are a hiring expert for the Saudi/GCC job market. Generate realistic, professional interview questions.`;

    const userPrompt = locale === 'ar'
        ? `أنشئ ${count} سؤال مقابلة لمنصب "${targetRole}" في مجال ${industry || 'عام'}.
مستوى الخبرة: ${experienceLevel === 'junior' ? 'مبتدئ' : experienceLevel === 'mid' ? 'متوسط' : experienceLevel === 'senior' ? 'متقدم' : 'تنفيذي'}
${resumeSummary ? `ملخص السيرة الذاتية: ${resumeSummary}` : ''}
${skills?.length ? `المهارات: ${skills.join(', ')}` : ''}

أنشئ أسئلة متنوعة: سلوكية، تقنية، ظرفية، عن الخبرة، والثقافة.
أجب بصيغة JSON مع: id, question, category, difficulty, tips.`
        : `Generate ${count} interview questions for a "${targetRole}" position in ${industry || 'general'} industry.
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

    try {
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        // Handle different response formats
        const questions = result.questions || result.interview_questions || Object.values(result).find(v => Array.isArray(v)) || [];

        if (questions.length > 0) {
            return questions.map((q: any, i: number) => ({
                id: q.id || `q-${i + 1}`,
                question: q.question || q.text || q,
                category: q.category || 'behavioral',
                difficulty: q.difficulty || 'medium',
                tips: q.tips || '',
            }));
        }

        // Fallback questions if AI fails
        return generateFallbackQuestions(context, count);
    } catch (error) {
        console.error('Failed to parse interview questions:', error);
        return generateFallbackQuestions(context, count);
    }
}

// Fallback questions when AI fails
function generateFallbackQuestions(context: InterviewContext, count: number): InterviewQuestion[] {
    const { targetRole, locale = 'en' } = context;

    const fallbackQuestions = locale === 'ar' ? [
        { question: `لماذا ترغب في العمل كـ ${targetRole}؟`, category: 'behavioral', difficulty: 'easy' },
        { question: 'حدثني عن أكبر إنجاز مهني حققته.', category: 'experience', difficulty: 'medium' },
        { question: 'كيف تتعامل مع ضغط العمل والمواعيد النهائية الضيقة؟', category: 'situational', difficulty: 'medium' },
        { question: 'أين ترى نفسك بعد خمس سنوات؟', category: 'behavioral', difficulty: 'easy' },
        { question: 'ما هي نقاط قوتك وضعفك الرئيسية؟', category: 'behavioral', difficulty: 'medium' },
    ] : [
        { question: `Why do you want to work as a ${targetRole}?`, category: 'behavioral', difficulty: 'easy' },
        { question: 'Tell me about your greatest professional achievement.', category: 'experience', difficulty: 'medium' },
        { question: 'How do you handle work pressure and tight deadlines?', category: 'situational', difficulty: 'medium' },
        { question: 'Where do you see yourself in five years?', category: 'behavioral', difficulty: 'easy' },
        { question: 'What are your main strengths and weaknesses?', category: 'behavioral', difficulty: 'medium' },
    ];

    return fallbackQuestions.slice(0, count).map((q, i) => ({
        id: `fallback-${i + 1}`,
        question: q.question,
        category: q.category as any,
        difficulty: q.difficulty as any,
    }));
}

// Conduct live interview conversation
export async function conductInterview(
    messages: Array<{ role: 'interviewer' | 'candidate'; content: string }>,
    context: InterviewContext,
    currentQuestion: string
): Promise<string> {
    const { targetRole, locale = 'en' } = context;

    const systemPrompt = locale === 'ar'
        ? `أنت مدير توظيف محترف تجري مقابلة لمنصب "${targetRole}".
- كن ودوداً لكن محترفاً
- اطرح أسئلة متابعة ذكية بناءً على إجابات المرشح
- لا تكرر الأسئلة
- تصرف كمحاور حقيقي، ليس روبوت
- ردودك قصيرة ومختصرة (جملة أو جملتين)`
        : `You are a professional hiring manager conducting an interview for "${targetRole}" position.
- Be friendly but professional
- Ask smart follow-up questions based on candidate responses
- Don't repeat questions
- Act like a real interviewer, not a robot
- Keep responses short (1-2 sentences)`;

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

    return response.choices[0]?.message?.content || '';
}

// Evaluate candidate's answer
export async function evaluateAnswer(
    question: string,
    answer: string,
    context: InterviewContext
): Promise<InterviewFeedback> {
    const { locale = 'en' } = context;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير مقابلات. قيّم إجابة المرشح باستخدام منهجية STAR. أعطِ تقييماً صادقاً وبنّاءً.`
        : `You are an interview expert. Evaluate the candidate's answer using the STAR method. Give honest, constructive feedback.`;

    const userPrompt = locale === 'ar'
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

    try {
        return JSON.parse(response.choices[0]?.message?.content || '{}');
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
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'onyx'
): Promise<ArrayBuffer> {
    const response = await getOpenAI().audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
        speed: 1.0,
    });

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
    const { locale = 'en' } = context;

    const avgScore = questions.reduce((sum, q) => sum + q.score, 0) / questions.length;

    const systemPrompt = locale === 'ar'
        ? `أنت مستشار مهني. لخّص أداء المرشح في المقابلة التدريبية.`
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

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');

    return {
        overallScore: Math.round(avgScore * 10) / 10,
        summary: result.summary || '',
        topStrength: result.topStrength || '',
        topImprovement: result.topImprovement || '',
        readinessLevel:
            avgScore >= 8 ? 'excellent' : avgScore >= 6 ? 'ready' : avgScore >= 4 ? 'needs_practice' : 'not_ready',
    };
}
