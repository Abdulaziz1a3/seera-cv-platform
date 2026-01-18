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

// Get salary range for role and level
function getSalaryRange(role: string, level: string): { min: number; max: number } {
    const roleData = GCC_SALARY_DATA[role] || GCC_SALARY_DATA['default'];
    return roleData[level] || roleData['mid'];
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
    const currentRole = resume.experience[0]?.position || 'Professional';
    const trimmedSkills = resume.skills.slice(0, 12);
    const trimmedEducation = resume.education.slice(0, 2).map((e) => `${e.degree} in ${e.field}`.trim()).join('; ');
    const trimmedSummary = (resume.summary || 'Not provided').slice(0, 400);

    const systemPrompt = locale === 'ar'
        ? `أنت مستشار مهني خبير في سوق العمل السعودي والخليجي. حلل السيرة الذاتية واقترح مسارات مهنية واقعية.`
        : `You are an expert career advisor for the Saudi/GCC job market. Analyze the resume and suggest realistic career paths.`;

    const userPrompt = `Analyze this professional's career and provide detailed guidance:

Current Role: ${currentRole}
Experience: ${yearsExp} years
Skills: ${trimmedSkills.join(', ')}
Education: ${trimmedEducation || 'Not provided'}
Summary: ${trimmedSummary}

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

    // Enrich career paths with salary data
    const enrichedPaths = (analysis.careerPaths || []).map((path: any) => ({
        ...path,
        timeline: (path.timeline || []).map((milestone: any, index: number) => ({
            ...milestone,
            salaryRange: getSalaryRange(
                milestone.title || currentRole,
                ['mid', 'senior', 'lead', 'director', 'executive'][Math.min(index, 4)]
            ),
        })),
        salaryProgression: (path.timeline || []).map((_: any, index: number) => {
            const level = ['mid', 'senior', 'lead', 'director', 'executive'][Math.min(index, 4)];
            const range = getSalaryRange(currentRole, level);
            return (range.min + range.max) / 2;
        }),
    }));

    // Calculate career score
    const careerScore = calculateCareerScore(resume, analysis.skillGaps || []);

    return {
        currentPosition: {
            title: currentRole,
            level: currentLevel,
            yearsExperience: yearsExp,
            estimatedSalary: { ...getSalaryRange(currentRole, currentLevel), currency: 'SAR' },
            marketDemand: 'high',
        },
        careerPaths: enrichedPaths,
        skillGaps: (analysis.skillGaps || []).map((gap: any) => ({
            ...gap,
            currentLevel: gap.currentLevel || 'beginner',
            requiredLevel: gap.requiredLevel || 'advanced',
            resources: gap.resources || [],
        })),
        strengths: analysis.strengths || [],
        weeklyActions: (analysis.weeklyActions || []).map((action: any) => ({
            ...action,
            completed: false,
        })),
        careerScore,
        industryInsights: analysis.industryInsights || {
            trendingSkills: [],
            hotIndustries: [],
            saudizationOpportunities: [],
            salaryTrends: '',
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
