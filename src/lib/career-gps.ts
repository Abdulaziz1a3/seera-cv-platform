// AI Career GPS Service
// Comprehensive career path analysis, skill gaps, and action planning

import { getOpenAI } from '@/lib/openai';
import { calculateChatCostUsd, calculateCreditsFromUsd, recordAICreditUsage } from '@/lib/ai-credits';
import type { ResumeCareerProfile } from '@/lib/resume-normalizer';

// Types
export interface CareerPath {
    id: string;
    name: string;
    description: string;
    track: 'technical' | 'management' | 'specialist' | 'entrepreneurial';
    timeline: CareerMilestone[];
    salaryProgression: number[];
    probability: number; // 0-100 likelihood of success
    requirements: string[];
}

export interface CareerMilestone {
    title: string;
    yearsFromNow: number;
    salaryRange: { min: number; max: number; currency: string };
    keySkills: string[];
    description: string;
}

export interface SkillGap {
    skill: string;
    currentLevel: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
    requiredLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    priority: 'critical' | 'high' | 'medium' | 'low';
    resources: { name: string; type: 'course' | 'certification' | 'project' | 'book'; url?: string }[];
    estimatedTimeToAcquire: string;
}

export interface WeeklyAction {
    id: string;
    title: string;
    description: string;
    category: 'skill' | 'network' | 'project' | 'learning' | 'application';
    priority: 'high' | 'medium' | 'low';
    estimatedHours: number;
    completed: boolean;
    dueDate?: string;
}

export interface CareerAnalysis {
    currentPosition: {
        title: string;
        level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'director' | 'executive';
        yearsExperience: number;
        estimatedSalary: { min: number; max: number; currency: string };
        marketDemand: 'low' | 'medium' | 'high' | 'very_high';
    };
    careerPaths: CareerPath[];
    skillGaps: SkillGap[];
    strengths: string[];
    weeklyActions: WeeklyAction[];
    careerScore: number; // 0-100
    industryInsights: {
        trendingSkills: string[];
        hotIndustries: string[];
        saudizationOpportunities: string[];
        salaryTrends: string;
    };
}

async function recordCareerUsage(params: {
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

// GCC Salary Data (SAR monthly)
const GCC_SALARY_DATA: Record<string, Record<string, { min: number; max: number }>> = {
    'Software Engineer': {
        entry: { min: 8000, max: 12000 },
        junior: { min: 12000, max: 16000 },
        mid: { min: 16000, max: 25000 },
        senior: { min: 25000, max: 40000 },
        lead: { min: 35000, max: 55000 },
        director: { min: 50000, max: 80000 },
        executive: { min: 70000, max: 120000 },
    },
    'Product Manager': {
        entry: { min: 10000, max: 14000 },
        junior: { min: 14000, max: 20000 },
        mid: { min: 20000, max: 30000 },
        senior: { min: 30000, max: 45000 },
        lead: { min: 40000, max: 60000 },
        director: { min: 55000, max: 85000 },
        executive: { min: 80000, max: 130000 },
    },
    'Data Scientist': {
        entry: { min: 10000, max: 15000 },
        junior: { min: 15000, max: 22000 },
        mid: { min: 22000, max: 35000 },
        senior: { min: 35000, max: 50000 },
        lead: { min: 45000, max: 65000 },
        director: { min: 60000, max: 90000 },
        executive: { min: 85000, max: 140000 },
    },
    'Marketing Manager': {
        entry: { min: 8000, max: 12000 },
        junior: { min: 12000, max: 18000 },
        mid: { min: 18000, max: 28000 },
        senior: { min: 28000, max: 42000 },
        lead: { min: 38000, max: 55000 },
        director: { min: 50000, max: 75000 },
        executive: { min: 70000, max: 110000 },
    },
    'default': {
        entry: { min: 7000, max: 11000 },
        junior: { min: 11000, max: 16000 },
        mid: { min: 16000, max: 25000 },
        senior: { min: 25000, max: 38000 },
        lead: { min: 35000, max: 52000 },
        director: { min: 48000, max: 72000 },
        executive: { min: 65000, max: 100000 },
    },
};

const TRACK_SKILLS: Record<'en' | 'ar', Record<CareerPath['track'], string[]>> = {
    en: {
        technical: ['System design', 'Cloud platforms', 'APIs', 'Data analysis', 'Automation'],
        management: ['Leadership', 'Stakeholder management', 'Strategic planning', 'OKRs', 'Budgeting'],
        specialist: ['Domain expertise', 'Process optimization', 'Quality standards', 'Client management', 'Reporting'],
        entrepreneurial: ['Go-to-market', 'Product strategy', 'Growth marketing', 'Fundraising', 'Operations'],
    },
    ar: {
        technical: ['تصميم الأنظمة', 'منصات السحابة', 'واجهات برمجية', 'تحليل البيانات', 'الأتمتة'],
        management: ['القيادة', 'إدارة أصحاب المصلحة', 'التخطيط الاستراتيجي', 'أهداف الأداء', 'إدارة الميزانية'],
        specialist: ['خبرة تخصصية', 'تحسين العمليات', 'معايير الجودة', 'إدارة العملاء', 'التقارير'],
        entrepreneurial: ['استراتيجية السوق', 'استراتيجية المنتج', 'نمو الأعمال', 'التمويل', 'العمليات'],
    },
};

const FALLBACK_ACTIONS: Record<'en' | 'ar', Array<{ title: string; description: string; category: WeeklyAction['category'] }>> = {
    en: [
        {
            title: 'Refine your resume summary',
            description: 'Update the summary to match your target role and highlight impact.',
            category: 'learning',
        },
        {
            title: 'Build a measurable achievement',
            description: 'Add 2 quantified achievements to your most recent role.',
            category: 'project',
        },
        {
            title: 'Grow your network',
            description: 'Connect with 5 professionals in your target industry on LinkedIn.',
            category: 'network',
        },
    ],
    ar: [
        {
            title: 'تحديث ملخص السيرة',
            description: 'حدّث الملخص ليتوافق مع الدور المستهدف ويبرز تأثيرك.',
            category: 'learning',
        },
        {
            title: 'إضافة إنجازات رقمية',
            description: 'أضف إنجازين بأرقام واضحة في أحدث خبراتك.',
            category: 'project',
        },
        {
            title: 'توسيع شبكة العلاقات',
            description: 'تواصل مع 5 محترفين في المجال المستهدف عبر لينكدإن.',
            category: 'network',
        },
    ],
};

function normalizeSkill(skill: string): string {
    return skill.trim().toLowerCase();
}

function inferTrack(role: string): CareerPath['track'] {
    const normalized = role.toLowerCase();
    if (/(manager|lead|director|head|chief)/.test(normalized)) return 'management';
    if (/(founder|entrepreneur|startup|co-founder)/.test(normalized)) return 'entrepreneurial';
    if (/(engineer|developer|software|data|analyst|devops|security)/.test(normalized)) return 'technical';
    return 'specialist';
}

function buildFallbackPaths(
    role: string,
    locale: 'en' | 'ar',
    track: CareerPath['track']
): CareerPath[] {
    const labelRole = role || (locale === 'ar' ? 'مختص' : 'Professional');
    const trackSkills = TRACK_SKILLS[locale][track];
    const mgmtSkills = TRACK_SKILLS[locale].management;

    const primaryName = locale === 'ar' ? `مسار التخصص في ${labelRole}` : `Senior ${labelRole}`;
    const primaryDescription = locale === 'ar'
        ? 'تطوير التخصص مع أثر واضح وتحسين النتائج.'
        : `Deepen expertise in ${labelRole} with measurable impact.`;

    const leadershipName = locale === 'ar'
        ? `مسار القيادة في ${labelRole}`
        : `Team Lead / Manager (${labelRole})`;
    const leadershipDescription = locale === 'ar'
        ? 'الانتقال إلى القيادة عبر إدارة الفريق والاستراتيجية.'
        : 'Move into leadership through team ownership and strategic delivery.';

    return [
        {
            id: 'path-specialist',
            name: primaryName,
            description: primaryDescription,
            track,
            timeline: [
                {
                    title: locale === 'ar' ? `أخصائي أول ${labelRole}` : `Senior ${labelRole}`,
                    yearsFromNow: 1,
                    keySkills: trackSkills.slice(0, 3),
                    description: locale === 'ar'
                        ? 'تعميق الخبرة وتسليم نتائج أعلى تأثيراً.'
                        : 'Increase scope, impact, and ownership of outcomes.',
                    salaryRange: { ...getSalaryRange(labelRole, 'senior'), currency: 'SAR' },
                },
                {
                    title: locale === 'ar' ? `قائد ${labelRole}` : `Lead ${labelRole}`,
                    yearsFromNow: 3,
                    keySkills: trackSkills.slice(0, 4),
                    description: locale === 'ar'
                        ? 'قيادة مبادرات أكبر وتوجيه الفريق فنياً.'
                        : 'Lead larger initiatives and mentor peers.',
                    salaryRange: { ...getSalaryRange(labelRole, 'lead'), currency: 'SAR' },
                },
            ],
            salaryProgression: [],
            probability: 70,
            requirements: trackSkills,
        },
        {
            id: 'path-leadership',
            name: leadershipName,
            description: leadershipDescription,
            track: 'management',
            timeline: [
                {
                    title: locale === 'ar' ? `مشرف ${labelRole}` : `Supervisor (${labelRole})`,
                    yearsFromNow: 2,
                    keySkills: mgmtSkills.slice(0, 3),
                    description: locale === 'ar'
                        ? 'إدارة مهام الفريق وتنسيق أصحاب المصلحة.'
                        : 'Own team delivery and stakeholder alignment.',
                    salaryRange: { ...getSalaryRange(labelRole, 'lead'), currency: 'SAR' },
                },
                {
                    title: locale === 'ar' ? `مدير ${labelRole}` : `Manager (${labelRole})`,
                    yearsFromNow: 4,
                    keySkills: mgmtSkills.slice(0, 4),
                    description: locale === 'ar'
                        ? 'قيادة الفريق وتحقيق أهداف الأداء.'
                        : 'Drive strategy, performance, and team growth.',
                    salaryRange: { ...getSalaryRange(labelRole, 'director'), currency: 'SAR' },
                },
            ],
            salaryProgression: [],
            probability: 55,
            requirements: mgmtSkills,
        },
    ];
}

function buildFallbackSkillGaps(
    resumeSkills: string[],
    locale: 'en' | 'ar',
    track: CareerPath['track']
): SkillGap[] {
    const normalizedSkills = resumeSkills.map(normalizeSkill);
    const recommended = TRACK_SKILLS[locale][track];
    const missing = recommended.filter((skill) => !normalizedSkills.includes(normalizeSkill(skill)));
    const gaps = missing.slice(0, 3);
    const estimate = locale === 'ar' ? '4-6 أسابيع' : '4-6 weeks';

    return gaps.map((skill, index) => ({
        skill,
        currentLevel: 'beginner',
        requiredLevel: 'advanced',
        priority: index === 0 ? 'high' : 'medium',
        resources: [],
        estimatedTimeToAcquire: estimate,
    }));
}

function buildFallbackStrengths(resumeSkills: string[], locale: 'en' | 'ar'): string[] {
    if (resumeSkills.length >= 3) {
        return resumeSkills.slice(0, 3);
    }
    return locale === 'ar'
        ? ['التعلّم السريع', 'المرونة', 'الالتزام بالجودة']
        : ['Fast learner', 'Adaptable', 'Quality-focused'];
}

function buildFallbackWeeklyActions(locale: 'en' | 'ar'): WeeklyAction[] {
    return FALLBACK_ACTIONS[locale].map((action, index) => ({
        id: `fallback-action-${index + 1}`,
        title: action.title,
        description: action.description,
        category: action.category,
        priority: index === 0 ? 'high' : 'medium',
        estimatedHours: index === 0 ? 2 : 1,
        completed: false,
    }));
}

// Get salary range for role and level
function getSalaryRange(role: string, level: string): { min: number; max: number } {
    const roleData = GCC_SALARY_DATA[role] || GCC_SALARY_DATA['default'];
    return roleData[level] || roleData['mid'];
}

function getCurrentRole(resume: ResumeCareerProfile): string {
    const current = resume.experience.find((exp) => exp.current && exp.position);
    if (current?.position) return current.position;

    const dated = resume.experience
        .filter((exp) => exp.position && exp.startDate)
        .map((exp) => ({ exp, date: new Date(exp.startDate as string).getTime() }))
        .filter((item) => !Number.isNaN(item.date))
        .sort((a, b) => b.date - a.date);

    if (dated[0]?.exp?.position) return dated[0].exp.position;

    return resume.experience.find((exp) => exp.position)?.position || resume.targetRole || 'Professional';
}

function buildExperienceHighlights(experience: ResumeCareerProfile['experience']): string {
    if (!experience || experience.length === 0) return 'Not provided';

    const sorted = [...experience].sort((a, b) => {
        if (a.current && !b.current) return -1;
        if (!a.current && b.current) return 1;
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
        if (Number.isNaN(dateA)) return 1;
        if (Number.isNaN(dateB)) return -1;
        return dateB - dateA;
    });

    return sorted.slice(0, 3).map((exp) => {
        const role = exp.position || 'Role';
        const company = exp.company ? ` at ${exp.company}` : '';
        const current = exp.current ? ' (current)' : '';
        const bullets = exp.bullets.slice(0, 3).join('; ');
        return `- ${role}${company}${current}: ${bullets || 'No highlights listed'}`;
    }).join('\n');
}

// Calculate years of experience from resume
function calculateYearsExperience(resume: ResumeCareerProfile): number {
    if (!resume.experience || resume.experience.length === 0) return 0;

    let totalMonths = 0;
    resume.experience.forEach(exp => {
        if (!exp.startDate) return;
        const start = new Date(exp.startDate);
        const end = exp.current || !exp.endDate ? new Date() : new Date(exp.endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(0, months);
    });

    return Math.round(totalMonths / 12 * 10) / 10;
}

// Determine career level from experience
function determineLevel(yearsExp: number): 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'director' | 'executive' {
    if (yearsExp < 1) return 'entry';
    if (yearsExp < 2) return 'junior';
    if (yearsExp < 5) return 'mid';
    if (yearsExp < 8) return 'senior';
    if (yearsExp < 12) return 'lead';
    if (yearsExp < 18) return 'director';
    return 'executive';
}

// Main career analysis function
export async function analyzeCareer(
    resume: ResumeCareerProfile,
    options: { locale?: 'ar' | 'en'; targetIndustry?: string; userId?: string } = {}
): Promise<CareerAnalysis> {
    const { locale = 'en', targetIndustry } = options;

    const yearsExp = calculateYearsExperience(resume);
    const currentLevel = determineLevel(yearsExp);
    const targetRole = resume.targetRole?.trim() || '';
    const currentRole = getCurrentRole(resume);
    const focusRole = targetRole || currentRole || 'Professional';
    const trimmedSkills = resume.skills.slice(0, 12);
    const trimmedEducation = resume.education.slice(0, 2).map((e) => `${e.degree} in ${e.field}`.trim()).join('; ');
    const trimmedSummary = (resume.summary || 'Not provided').slice(0, 400);
    const experienceHighlights = buildExperienceHighlights(resume.experience);
    const certificationNames = resume.certifications
        .map((cert) => cert.name || '')
        .filter((name) => name.trim().length > 0)
        .slice(0, 4)
        .join(', ');
    const projectNames = resume.projects
        .map((project) => project.name || '')
        .filter((name) => name.trim().length > 0)
        .slice(0, 4)
        .join(', ');

    const systemPrompt = locale === 'ar'
        ? `أنت مستشار مهني خبير في سوق العمل السعودي والخليجي. حلل السيرة الذاتية بدقة وقدم مسارات واقعية مبنية على البيانات فقط. لا تخترع خبرات أو مهارات غير موجودة.`
        : `You are an expert career advisor for the Saudi/GCC job market. Analyze the resume precisely and suggest realistic paths grounded in the provided details only. Do not invent skills or experience.`;

    const userPrompt = `Analyze this professional's career and provide detailed guidance:

Current Role: ${currentRole}
Target Role: ${targetRole || 'Not provided'}
Experience: ${yearsExp} years
Skills: ${trimmedSkills.join(', ')}
Education: ${trimmedEducation || 'Not provided'}
Summary: ${trimmedSummary}
Experience Highlights:
${experienceHighlights}
Certifications: ${certificationNames || 'Not provided'}
Projects: ${projectNames || 'Not provided'}

${targetIndustry ? `Target Industry: ${targetIndustry}` : ''}

Provide a comprehensive career analysis in JSON format:
{
  "careerPaths": [
    {
      "id": "path1",
      "name": "Path name",
      "description": "Brief description",
      "track": "technical|management|specialist|entrepreneurial",
      "timeline": [
        {
          "title": "Role title",
          "yearsFromNow": 2,
          "keySkills": ["skill1", "skill2"],
          "description": "Brief role description"
        }
      ],
      "probability": 75,
      "requirements": ["requirement1", "requirement2"]
    }
  ],
  "skillGaps": [
    {
      "skill": "Skill name",
      "currentLevel": "intermediate",
      "requiredLevel": "advanced",
      "priority": "critical|high|medium|low",
      "estimatedTimeToAcquire": "3 months",
      "resources": [
        { "name": "Course name", "type": "course" }
      ]
    }
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "weeklyActions": [
    {
      "id": "action1",
      "title": "Action title",
      "description": "What to do",
      "category": "skill|network|project|learning|application",
      "priority": "high|medium|low",
      "estimatedHours": 2
    }
  ],
  "industryInsights": {
    "trendingSkills": ["skill1", "skill2"],
    "hotIndustries": ["industry1", "industry2"],
    "saudizationOpportunities": ["opportunity1"],
    "salaryTrends": "Brief salary trend description"
  }
}

Generate 1-2 realistic career paths with 2-3 milestones each. Include 2-3 skill gaps, 3 strengths, and 3 weekly actions. Keep responses concise and compact.`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 700,
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    await recordCareerUsage({
        userId: options.userId,
        model: 'gpt-4o-mini',
        usage: response.usage,
        operation: 'career_analyze',
    });

    let analysis;
    try {
        analysis = JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
        analysis = {};
    }

    const localeKey: 'en' | 'ar' = locale === 'ar' ? 'ar' : 'en';
    const inferredTrack = inferTrack(focusRole);
    const fallbackPaths = buildFallbackPaths(focusRole, localeKey, inferredTrack);

    // Enrich career paths with salary data + fallback data
    const basePaths = Array.isArray(analysis.careerPaths) && analysis.careerPaths.length > 0
        ? analysis.careerPaths
        : fallbackPaths;
    const enrichedPaths = basePaths.map((path: any, index: number) => {
        const fallbackPath = fallbackPaths[index] || fallbackPaths[0];
        const timeline = Array.isArray(path.timeline) && path.timeline.length > 0
            ? path.timeline
            : fallbackPath.timeline;

        return {
            id: path.id || fallbackPath.id || `path-${index + 1}`,
            name: path.name || fallbackPath.name,
            description: path.description || fallbackPath.description,
            track: path.track || fallbackPath.track || inferredTrack,
            timeline: timeline.map((milestone: any, mIndex: number) => ({
                ...milestone,
                title: milestone.title || fallbackPath.timeline[mIndex]?.title || fallbackPath.timeline[0]?.title,
                yearsFromNow: Number.isFinite(milestone.yearsFromNow)
                    ? milestone.yearsFromNow
                    : fallbackPath.timeline[mIndex]?.yearsFromNow || 1,
                keySkills: Array.isArray(milestone.keySkills) && milestone.keySkills.length > 0
                    ? milestone.keySkills
                    : fallbackPath.timeline[mIndex]?.keySkills || fallbackPath.timeline[0]?.keySkills || [],
                description: milestone.description || fallbackPath.timeline[mIndex]?.description || '',
                salaryRange: { ...getSalaryRange(
                    milestone.title || focusRole,
                    ['mid', 'senior', 'lead', 'director', 'executive'][Math.min(mIndex, 4)]
                ), currency: 'SAR' },
            })),
            salaryProgression: timeline.map((_: any, mIndex: number) => {
                const level = ['mid', 'senior', 'lead', 'director', 'executive'][Math.min(mIndex, 4)];
                const range = getSalaryRange(focusRole, level);
                return (range.min + range.max) / 2;
            }),
            probability: Number.isFinite(path.probability) ? path.probability : (fallbackPath.probability || 60),
            requirements: Array.isArray(path.requirements) && path.requirements.length > 0
                ? path.requirements
                : fallbackPath.requirements || [],
        };
    });

    const skillGapsFallback = buildFallbackSkillGaps(trimmedSkills, localeKey, inferredTrack);
    const resolvedSkillGaps = Array.isArray(analysis.skillGaps) && analysis.skillGaps.length > 0
        ? analysis.skillGaps
        : skillGapsFallback;

    // Calculate career score
    const careerScore = calculateCareerScore(resume, resolvedSkillGaps);

    return {
        currentPosition: {
            title: currentRole,
            level: currentLevel,
            yearsExperience: yearsExp,
            estimatedSalary: { ...getSalaryRange(currentRole, currentLevel), currency: 'SAR' },
            marketDemand: 'high',
        },
        careerPaths: enrichedPaths,
        skillGaps: resolvedSkillGaps.map((gap: any) => ({
            ...gap,
            currentLevel: gap.currentLevel || 'beginner',
            requiredLevel: gap.requiredLevel || 'advanced',
            resources: gap.resources || [],
        })),
        strengths: Array.isArray(analysis.strengths) && analysis.strengths.length > 0
            ? analysis.strengths
            : buildFallbackStrengths(trimmedSkills, localeKey),
        weeklyActions: (Array.isArray(analysis.weeklyActions) && analysis.weeklyActions.length > 0
            ? analysis.weeklyActions
            : buildFallbackWeeklyActions(localeKey)
        ).map((action: any, index: number) => ({
            id: action.id || `action-${index + 1}`,
            ...action,
            completed: false,
        })),
        careerScore,
        industryInsights: {
            trendingSkills: analysis.industryInsights?.trendingSkills?.length
                ? analysis.industryInsights.trendingSkills
                : TRACK_SKILLS[localeKey][inferredTrack].slice(0, 4),
            hotIndustries: analysis.industryInsights?.hotIndustries?.length
                ? analysis.industryInsights.hotIndustries
                : (localeKey === 'ar'
                    ? ['التقنية المالية', 'الذكاء الاصطناعي', 'الصحة الرقمية']
                    : ['Fintech', 'AI & Data', 'Digital Health']
                ),
            saudizationOpportunities: analysis.industryInsights?.saudizationOpportunities?.length
                ? analysis.industryInsights.saudizationOpportunities
                : (localeKey === 'ar'
                    ? ['فرص متزايدة في القطاع الخاص', 'برامج تمكين المواهب الوطنية']
                    : ['Growing private sector hiring', 'National talent enablement programs']
                ),
            salaryTrends: analysis.industryInsights?.salaryTrends
                ? analysis.industryInsights.salaryTrends
                : (localeKey === 'ar'
                    ? 'الرواتب في اتجاه تصاعدي للمهارات الرقمية والقيادية.'
                    : 'Salaries trend upward for digital and leadership skills.'
                ),
        },
    };
}

// Calculate career score based on resume completeness and skills
function calculateCareerScore(resume: ResumeCareerProfile, skillGaps: SkillGap[]): number {
    let score = 0;

    // Experience depth (25 pts)
    const yearsExp = calculateYearsExperience(resume);
    score += Math.min(25, yearsExp * 3);

    // Skills breadth (25 pts)
    score += Math.min(25, resume.skills.length * 2);

    // Education (15 pts)
    if (resume.education.length > 0) {
        score += 10;
        if (resume.education.some(e => (e.degree ?? '').toLowerCase().includes('master') || (e.degree ?? '').toLowerCase().includes('mba'))) {
            score += 5;
        }
    }

    // Certifications (10 pts)
    if (resume.certifications && resume.certifications.length > 0) {
        score += Math.min(10, resume.certifications.length * 3);
    }

    // Skill gap penalty (up to -15 pts)
    const criticalGaps = skillGaps.filter(g => g.priority === 'critical').length;
    score -= Math.min(15, criticalGaps * 5);

    // Profile completeness (25 pts)
    if (resume.summary && resume.summary.length > 100) score += 8;
    if (resume.contact.linkedin) score += 5;
    if (resume.experience.length >= 3) score += 7;
    if (resume.projects && resume.projects.length > 0) score += 5;

    return Math.max(0, Math.min(100, score));
}

// Generate specific action plan for a career path
export async function generateActionPlan(
    resume: ResumeCareerProfile,
    targetPath: CareerPath,
    options: { locale?: 'ar' | 'en'; weeks?: number; userId?: string } = {}
): Promise<WeeklyAction[]> {
    const { locale = 'en', weeks = 4 } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت مدرب مهني. أنشئ خطة عمل أسبوعية محددة وقابلة للتنفيذ.`
        : `You are a career coach. Create a specific, actionable weekly action plan.`;

    const userPrompt = `Create a ${weeks}-week action plan for someone to progress towards:
Target: ${targetPath.name}
Current Role: ${resume.experience[0]?.position || 'Professional'}
Current Skills: ${resume.skills.join(', ')}
Required Skills: ${targetPath.requirements.join(', ')}

Generate ${weeks * 3} specific actions in JSON format:
{
  "actions": [
    {
      "id": "week1-1",
      "title": "Action title",
      "description": "Specific steps",
      "category": "skill|network|project|learning|application",
      "priority": "high|medium|low",
      "estimatedHours": 2,
      "week": 1
    }
  ]
}`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: 'json_object' },
    });

    await recordCareerUsage({
        userId: options.userId,
        model: 'gpt-4o-mini',
        usage: response.usage,
        operation: 'career_action_plan',
    });

    try {
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return (result.actions || []).map((action: any) => ({
            ...action,
            completed: false,
        }));
    } catch {
        return [];
    }
}

// Get real-time industry insights for GCC
export async function getIndustryInsights(
    industry: string,
    options: { locale?: 'ar' | 'en'; userId?: string } = {}
): Promise<{
    trendingRoles: string[];
    salaryTrends: string;
    topCompanies: string[];
    inDemandSkills: string[];
    saudizationInfo: string;
}> {
    const { locale = 'en' } = options;

    const systemPrompt = locale === 'ar'
        ? `أنت خبير في سوق العمل السعودي. قدم رؤى حول صناعة محددة.`
        : `You are a Saudi job market expert. Provide insights about a specific industry.`;

    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: `Provide GCC/Saudi job market insights for ${industry} industry in JSON:
{
  "trendingRoles": ["role1", "role2"],
  "salaryTrends": "Brief trend description",
  "topCompanies": ["company1", "company2"],
  "inDemandSkills": ["skill1", "skill2"],
  "saudizationInfo": "Saudization requirements and opportunities"
}`,
            },
        ],
        max_tokens: 600,
        temperature: 0.6,
        response_format: { type: 'json_object' },
    });

    await recordCareerUsage({
        userId: options.userId,
        model: 'gpt-4o-mini',
        usage: response.usage,
        operation: 'career_insights',
    });

    try {
        return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch {
        return {
            trendingRoles: [],
            salaryTrends: '',
            topCompanies: [],
            inDemandSkills: [],
            saudizationInfo: '',
        };
    }
}
