// LinkedIn Profile Optimizer AI Service
// Transforms resume data into optimized LinkedIn profile content

import { getOpenAI } from '@/lib/openai';
import type { ResumeAIProfile } from '@/lib/resume-normalizer';

export interface LinkedInProfile {
    headline: string;
    headlineOptions: string[];
    summary: string;
    experience: Array<{
        title: string;
        company: string;
        description: string;
    }>;
    skills: string[];
    featuredSkills: string[];
    profileScore: number;
    improvements: string[];
}

export interface OptimizationOptions {
    locale?: 'ar' | 'en';
    tone?: 'professional' | 'creative' | 'executive';
    industry?: string;
    targetAudience?: 'recruiters' | 'clients' | 'networking';
}

// Generate optimized LinkedIn headline options
export async function generateHeadlines(
    resume: ResumeAIProfile,
    options: OptimizationOptions = {}
): Promise<string[]> {
    const { locale = 'en', tone = 'professional' } = options;

    const currentRole = resume.experience[0]?.position || 'Professional';
    const skills = resume.skills.slice(0, 5).join(', ');

    const systemPrompt = locale === 'ar'
        ? `أنت خبير LinkedIn. اكتب 5 عناوين ملفات شخصية جذابة وقصيرة (حد 120 حرف). استخدم كلمات مفتاحية للبحث.`
        : `You are a LinkedIn expert. Write 5 compelling, short profile headlines (120 char limit). Use searchable keywords.`;

    const userPrompt = locale === 'ar'
        ? `اكتب 5 عناوين LinkedIn لشخص يعمل كـ "${currentRole}" مع خبرة في: ${skills}. اللهجة: ${tone === 'creative' ? 'إبداعية' : tone === 'executive' ? 'تنفيذية' : 'مهنية'}.`
        : `Write 5 LinkedIn headlines for a "${currentRole}" with expertise in: ${skills}. Tone: ${tone}.`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 400,
        temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content || '';
    return content
        .split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(line => line.length > 10 && line.length <= 150);
}

// Generate optimized LinkedIn About/Summary section
export async function generateAboutSection(
    resume: ResumeAIProfile,
    options: OptimizationOptions = {}
): Promise<string> {
    const { locale = 'en', tone = 'professional', targetAudience = 'recruiters' } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير LinkedIn. اكتب قسم "نبذة عني" مقنع (2000 حرف كحد أقصى). 
استخدم:
- جملة افتتاحية قوية (hook)
- نقاط إنجازات بأرقام
- دعوة للتواصل
- كلمات مفتاحية للبحث
- فقرات قصيرة سهلة القراءة`
        : `You are a LinkedIn expert. Write a compelling "About" section (max 2000 chars).
Include:
- Strong opening hook
- Achievement bullets with numbers
- Call-to-action for connection
- Searchable keywords
- Short, scannable paragraphs`;

    const userPrompt = locale === 'ar'
        ? `اكتب قسم "نبذة عني" بناءً على:
الاسم: ${resume.contact.fullName}
المنصب الحالي: ${resume.experience[0]?.position || 'محترف'}
الشركة: ${resume.experience[0]?.company || ''}
الملخص الحالي: ${resume.summary}
المهارات: ${resume.skills.join(', ')}
الجمهور المستهدف: ${targetAudience === 'recruiters' ? 'مسؤولو التوظيف' : targetAudience === 'clients' ? 'العملاء' : 'التواصل المهني'}`
        : `Write an "About" section based on:
Name: ${resume.contact.fullName}
Current role: ${resume.experience[0]?.position || 'Professional'}
Company: ${resume.experience[0]?.company || ''}
Current summary: ${resume.summary}
Skills: ${resume.skills.join(', ')}
Target audience: ${targetAudience}`;

    const response = await getOpenAI().chat.completions.create({
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

// Optimize experience descriptions for LinkedIn
export async function optimizeExperience(
    resume: ResumeAIProfile,
    options: OptimizationOptions = {}
): Promise<Array<{ title: string; company: string; description: string }>> {
    const { locale = 'en' } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير LinkedIn. حوّل نقاط السيرة الذاتية إلى وصف وظيفي جذاب يبرز الإنجازات بأرقام ويستخدم كلمات مفتاحية.`
        : `You are a LinkedIn expert. Transform resume bullets into engaging job descriptions that highlight achievements with numbers and use searchable keywords.`;

    const optimizedExperience = await Promise.all(
        resume.experience.slice(0, 3).map(async (exp) => {
            const userPrompt = locale === 'ar'
                ? `حوّل هذه النقاط إلى وصف وظيفي LinkedIn (300-500 حرف):
المنصب: ${exp.position}
الشركة: ${exp.company}
النقاط: ${exp.bullets.join('; ')}`
                : `Transform these bullets into a LinkedIn job description (300-500 chars):
Position: ${exp.position}
Company: ${exp.company}
Bullets: ${exp.bullets.join('; ')}`;

            const response = await getOpenAI().chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                max_tokens: 300,
                temperature: 0.6,
            });

            return {
                title: exp.position,
                company: exp.company,
                description: response.choices[0]?.message?.content || exp.bullets.join('\n'),
            };
        })
    );

    return optimizedExperience;
}

// Suggest optimized skills ordering
export async function optimizeSkills(
    resume: ResumeAIProfile,
    options: OptimizationOptions = {}
): Promise<{ skills: string[]; featured: string[] }> {
    const { locale = 'en', industry = '' } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير LinkedIn والتوظيف. رتّب المهارات حسب الطلب في السوق واقترح أفضل 3 مهارات للعرض.`
        : `You are a LinkedIn and hiring expert. Rank skills by market demand and suggest top 3 featured skills.`;

    const userPrompt = locale === 'ar'
        ? `رتّب هذه المهارات حسب الأهمية للسوق${industry ? ` في مجال ${industry}` : ''}:
${resume.skills.join(', ')}
أجب بصيغة JSON: { "ranked": [...], "featured": ["top1", "top2", "top3"] }`
        : `Rank these skills by market importance${industry ? ` in ${industry} industry` : ''}:
${resume.skills.join(', ')}
Reply in JSON: { "ranked": [...], "featured": ["top1", "top2", "top3"] }`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.5,
        response_format: { type: 'json_object' },
    });

    try {
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
            skills: result.ranked || resume.skills,
            featured: result.featured || resume.skills.slice(0, 3),
        };
    } catch {
        return {
            skills: resume.skills,
            featured: resume.skills.slice(0, 3),
        };
    }
}

// Calculate LinkedIn profile optimization score
export function calculateProfileScore(
    resume: ResumeAIProfile,
    optimizedProfile: Partial<LinkedInProfile>
): { score: number; improvements: string[] } {
    let score = 0;
    const improvements: string[] = [];

    // Photo (we can't check this, assume they have one)
    score += 10;

    // Headline (15 points)
    if (optimizedProfile.headline && optimizedProfile.headline.length > 20) {
        score += 15;
    } else {
        improvements.push('Add a compelling headline with keywords');
    }

    // About section (20 points)
    if (optimizedProfile.summary && optimizedProfile.summary.length > 200) {
        score += 20;
    } else if (optimizedProfile.summary) {
        score += 10;
        improvements.push('Expand your About section to at least 200 characters');
    } else {
        improvements.push('Add an About section to tell your story');
    }

    // Experience (25 points)
    const expCount = resume.experience.length;
    if (expCount >= 3) {
        score += 25;
    } else if (expCount >= 1) {
        score += expCount * 8;
        improvements.push('Add more work experience entries');
    } else {
        improvements.push('Add your work experience');
    }

    // Skills (15 points)
    const skillCount = resume.skills.length;
    if (skillCount >= 10) {
        score += 15;
    } else if (skillCount >= 5) {
        score += 10;
        improvements.push('Add at least 10 skills for better visibility');
    } else {
        score += skillCount;
        improvements.push('Add more skills to your profile');
    }

    // Education (10 points)
    if (resume.education.length > 0) {
        score += 10;
    } else {
        improvements.push('Add your education background');
    }

    // Contact info (5 points)
    if (resume.contact.email && resume.contact.linkedin) {
        score += 5;
    } else {
        improvements.push('Complete your contact information');
    }

    return { score: Math.min(100, score), improvements };
}

// Full profile optimization
export async function optimizeFullProfile(
    resume: ResumeAIProfile,
    options: OptimizationOptions = {}
): Promise<LinkedInProfile> {
    const [headlines, summary, experience, skillsData] = await Promise.all([
        generateHeadlines(resume, options),
        generateAboutSection(resume, options),
        optimizeExperience(resume, options),
        optimizeSkills(resume, options),
    ]);

    const partialProfile = {
        headline: headlines[0] || '',
        headlineOptions: headlines,
        summary,
        experience,
        skills: skillsData.skills,
        featuredSkills: skillsData.featured,
    };

    const { score, improvements } = calculateProfileScore(resume, partialProfile);

    return {
        ...partialProfile,
        profileScore: score,
        improvements,
    };
}
