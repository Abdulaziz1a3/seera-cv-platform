import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const exportFormat = searchParams.get('export') || '';

        // Filter parameters
        const location = searchParams.get('location') || '';
        const minExperience = searchParams.get('minExperience') || '';
        const maxExperience = searchParams.get('maxExperience') || '';
        const skills = searchParams.getAll('skills') || [];
        const education = searchParams.get('education') || '';
        const currentTitle = searchParams.get('currentTitle') || '';
        const industries = searchParams.getAll('industries') || [];
        const availabilityStatus = searchParams.get('availabilityStatus') || '';
        const plan = searchParams.get('plan') || '';
        const joinedAfter = searchParams.get('joinedAfter') || '';
        const joinedBefore = searchParams.get('joinedBefore') || '';

        const exportLimit = Math.min(parseInt(searchParams.get('limit') || '5000'), 10000);
        const skip = exportFormat ? 0 : (page - 1) * limit;
        const take = exportFormat ? exportLimit : limit;

        // Build where clause for users who have talent profiles or resume data
        const userWhere: any = {
            deletedAt: null,
            emailVerified: { not: null },
        };

        if (search) {
            userWhere.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { firstName: { contains: search, mode: 'insensitive' } } },
                { profile: { lastName: { contains: search, mode: 'insensitive' } } },
                { profile: { location: { contains: search, mode: 'insensitive' } } },
                { talentProfile: { currentTitle: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (plan) {
            userWhere.subscription = { plan: plan.toUpperCase() };
        }

        if (joinedAfter) {
            userWhere.createdAt = { ...userWhere.createdAt, gte: new Date(joinedAfter) };
        }

        if (joinedBefore) {
            userWhere.createdAt = { ...userWhere.createdAt, lte: new Date(joinedBefore) };
        }

        // Build talent profile where clause
        const talentWhere: any = {};

        if (location) {
            talentWhere.location = { contains: location, mode: 'insensitive' };
        }

        if (minExperience) {
            talentWhere.yearsExperience = { ...talentWhere.yearsExperience, gte: parseInt(minExperience) };
        }

        if (maxExperience) {
            talentWhere.yearsExperience = { ...talentWhere.yearsExperience, lte: parseInt(maxExperience) };
        }

        if (skills.length > 0) {
            talentWhere.skills = { hasSome: skills };
        }

        if (education) {
            talentWhere.education = { contains: education, mode: 'insensitive' };
        }

        if (currentTitle) {
            talentWhere.currentTitle = { contains: currentTitle, mode: 'insensitive' };
        }

        if (industries.length > 0) {
            talentWhere.preferredIndustries = { hasSome: industries };
        }

        if (availabilityStatus) {
            talentWhere.availabilityStatus = availabilityStatus;
        }

        // If we have talent profile filters, add them to the user where clause
        if (Object.keys(talentWhere).length > 0) {
            userWhere.talentProfile = talentWhere;
        }

        // Get users with comprehensive data
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: userWhere,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    profile: true,
                    subscription: {
                        select: { plan: true, status: true }
                    },
                    talentProfile: {
                        select: {
                            displayName: true,
                            currentTitle: true,
                            currentCompany: true,
                            location: true,
                            yearsExperience: true,
                            skills: true,
                            education: true,
                            availabilityStatus: true,
                            preferredIndustries: true,
                            desiredRoles: true,
                            desiredSalaryMin: true,
                            desiredSalaryMax: true,
                            noticePeriod: true,
                        }
                    },
                    resumes: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            title: true,
                            targetRole: true,
                            language: true,
                            sections: {
                                where: { type: { in: ['SKILLS', 'LANGUAGES', 'EDUCATION', 'EXPERIENCE'] } },
                                select: { type: true, content: true }
                            }
                        },
                        take: 1,
                        orderBy: { updatedAt: 'desc' }
                    },
                    seeraProfiles: {
                        where: { status: 'PUBLISHED' },
                        select: { title: true, location: true },
                        take: 1
                    },
                    _count: {
                        select: { resumes: true, interviewSessions: true }
                    }
                }
            }),
            prisma.user.count({ where: userWhere })
        ]);

        // Process and extract data from users
        const formattedUsers = users.map(user => {
            // Extract skills from resume sections if no talent profile
            let extractedSkills: string[] = [];
            let extractedLanguages: string[] = [];
            let extractedEducation = '';
            let extractedExperience: any[] = [];

            if (user.resumes?.[0]?.sections) {
                for (const section of user.resumes[0].sections) {
                    if (section.type === 'SKILLS' && section.content) {
                        const content = section.content as any;
                        if (content.skills) {
                            extractedSkills = content.skills.map((s: any) =>
                                typeof s === 'string' ? s : s.name || s.skill || ''
                            ).filter(Boolean);
                        }
                    }
                    if (section.type === 'LANGUAGES' && section.content) {
                        const content = section.content as any;
                        if (content.languages) {
                            extractedLanguages = content.languages.map((l: any) =>
                                typeof l === 'string' ? l : l.name || l.language || ''
                            ).filter(Boolean);
                        }
                    }
                    if (section.type === 'EDUCATION' && section.content) {
                        const content = section.content as any;
                        if (content.items?.[0]) {
                            extractedEducation = content.items[0].degree || content.items[0].field || '';
                        }
                    }
                    if (section.type === 'EXPERIENCE' && section.content) {
                        const content = section.content as any;
                        if (content.items) {
                            extractedExperience = content.items;
                        }
                    }
                }
            }

            // Calculate years of experience from resume if not in talent profile
            let yearsExperience = user.talentProfile?.yearsExperience;
            if (!yearsExperience && extractedExperience.length > 0) {
                const dates = extractedExperience
                    .filter((exp: any) => exp.startDate)
                    .map((exp: any) => new Date(exp.startDate).getFullYear());
                if (dates.length > 0) {
                    const earliestYear = Math.min(...dates);
                    yearsExperience = new Date().getFullYear() - earliestYear;
                }
            }

            // Get location from various sources
            const userLocation = user.talentProfile?.location
                || user.profile?.location
                || user.seeraProfiles?.[0]?.location
                || '';

            // Get title from various sources
            const currentTitle = user.talentProfile?.currentTitle
                || user.seeraProfiles?.[0]?.title
                || user.resumes?.[0]?.targetRole
                || '';

            // Combine skills from all sources
            const allSkills = [
                ...(user.talentProfile?.skills || []),
                ...extractedSkills
            ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

            return {
                id: user.id,
                name: user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown',
                email: user.email,
                image: user.image,
                phone: user.profile?.phone || '',
                location: userLocation,
                currentTitle,
                currentCompany: user.talentProfile?.currentCompany || '',
                yearsExperience,
                skills: allSkills.slice(0, 10), // Top 10 skills
                education: user.talentProfile?.education || extractedEducation,
                languages: extractedLanguages,
                industries: user.talentProfile?.preferredIndustries || [],
                desiredRoles: user.talentProfile?.desiredRoles || [],
                availabilityStatus: user.talentProfile?.availabilityStatus || 'unknown',
                salaryRange: user.talentProfile?.desiredSalaryMin && user.talentProfile?.desiredSalaryMax
                    ? `${user.talentProfile.desiredSalaryMin.toLocaleString()} - ${user.talentProfile.desiredSalaryMax.toLocaleString()} SAR`
                    : '',
                noticePeriod: user.talentProfile?.noticePeriod || '',
                plan: user.subscription?.plan || 'FREE',
                subscriptionStatus: user.subscription?.status || 'ACTIVE',
                resumeCount: user._count.resumes,
                interviewCount: user._count.interviewSessions,
                hasResume: user._count.resumes > 0,
                hasTalentProfile: !!user.talentProfile,
                hasSeeraProfile: user.seeraProfiles.length > 0,
                createdAt: user.createdAt,
                linkedinUrl: user.profile?.linkedinUrl || '',
                website: user.profile?.website || '',
            };
        });

        // CSV Export
        if (exportFormat === 'csv') {
            const header = [
                'Name',
                'Email',
                'Phone',
                'Location',
                'Current Title',
                'Current Company',
                'Years of Experience',
                'Skills',
                'Education',
                'Languages',
                'Industries',
                'Desired Roles',
                'Availability',
                'Salary Range',
                'Notice Period',
                'Plan',
                'Resumes',
                'Interviews',
                'LinkedIn',
                'Website',
                'Joined'
            ];
            const escapeCsv = (value: string) => `"${String(value || '').replace(/"/g, '""')}"`;
            const rows = formattedUsers.map((user) => [
                escapeCsv(user.name),
                escapeCsv(user.email),
                escapeCsv(user.phone),
                escapeCsv(user.location),
                escapeCsv(user.currentTitle),
                escapeCsv(user.currentCompany),
                user.yearsExperience?.toString() || '',
                escapeCsv(user.skills.join(', ')),
                escapeCsv(user.education),
                escapeCsv(user.languages.join(', ')),
                escapeCsv(user.industries.join(', ')),
                escapeCsv(user.desiredRoles.join(', ')),
                escapeCsv(user.availabilityStatus),
                escapeCsv(user.salaryRange),
                escapeCsv(user.noticePeriod),
                escapeCsv(user.plan),
                user.resumeCount.toString(),
                user.interviewCount.toString(),
                escapeCsv(user.linkedinUrl),
                escapeCsv(user.website),
                new Date(user.createdAt).toISOString(),
            ]);
            const csv = [header, ...rows].map((row) => row.join(',')).join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="user-data-export-${new Date().toISOString().split('T')[0]}.csv"`,
                },
            });
        }

        return NextResponse.json({
            users: formattedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin data error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}

// Get aggregated stats and filter options
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body;

        if (action === 'get_filter_options') {
            // Get unique locations
            const locations = await prisma.talentProfile.findMany({
                where: { location: { not: null } },
                select: { location: true },
                distinct: ['location'],
                take: 100
            });

            // Get unique skills (aggregate from all talent profiles)
            const talentProfiles = await prisma.talentProfile.findMany({
                select: { skills: true },
                take: 500
            });
            const allSkills = new Map<string, number>();
            talentProfiles.forEach(tp => {
                tp.skills.forEach(skill => {
                    allSkills.set(skill, (allSkills.get(skill) || 0) + 1);
                });
            });
            const topSkills = Array.from(allSkills.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 50)
                .map(([skill]) => skill);

            // Get unique industries
            const industries = new Set<string>();
            talentProfiles.forEach(tp => {
                if (tp.skills) {
                    // Industries are stored in preferredIndustries, let's get them
                }
            });

            const talentIndustries = await prisma.talentProfile.findMany({
                select: { preferredIndustries: true },
                take: 500
            });
            talentIndustries.forEach(tp => {
                tp.preferredIndustries.forEach(ind => industries.add(ind));
            });

            // Get unique education levels
            const educationLevels = await prisma.talentProfile.findMany({
                where: { education: { not: null } },
                select: { education: true },
                distinct: ['education'],
                take: 50
            });

            // Get unique titles
            const titles = await prisma.talentProfile.findMany({
                where: { currentTitle: { not: null } },
                select: { currentTitle: true },
                distinct: ['currentTitle'],
                take: 100
            });

            return NextResponse.json({
                locations: locations.map(l => l.location).filter(Boolean),
                skills: topSkills,
                industries: Array.from(industries),
                educationLevels: educationLevels.map(e => e.education).filter(Boolean),
                titles: titles.map(t => t.currentTitle).filter(Boolean),
                availabilityStatuses: ['open_to_offers', 'passive', 'not_looking', 'actively_looking'],
                plans: ['FREE', 'PRO', 'ENTERPRISE']
            });
        }

        if (action === 'get_stats') {
            const [
                totalUsers,
                usersWithProfiles,
                usersWithResumes,
                planDistribution,
                locationDistribution,
                experienceDistribution
            ] = await Promise.all([
                prisma.user.count({ where: { deletedAt: null, emailVerified: { not: null } } }),
                prisma.talentProfile.count(),
                prisma.user.count({ where: { deletedAt: null, resumes: { some: {} } } }),
                prisma.subscription.groupBy({
                    by: ['plan'],
                    _count: { plan: true }
                }),
                prisma.talentProfile.groupBy({
                    by: ['location'],
                    _count: { location: true },
                    where: { location: { not: null } },
                    orderBy: { _count: { location: 'desc' } },
                    take: 10
                }),
                prisma.talentProfile.groupBy({
                    by: ['yearsExperience'],
                    _count: { yearsExperience: true },
                    where: { yearsExperience: { not: null } },
                    orderBy: { yearsExperience: 'asc' }
                })
            ]);

            // Get top skills
            const talentProfiles = await prisma.talentProfile.findMany({
                select: { skills: true },
                take: 1000
            });
            const skillCounts = new Map<string, number>();
            talentProfiles.forEach(tp => {
                tp.skills.forEach(skill => {
                    skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
                });
            });
            const topSkills = Array.from(skillCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            return NextResponse.json({
                totalUsers,
                usersWithProfiles,
                usersWithResumes,
                planDistribution: planDistribution.map(p => ({
                    plan: p.plan,
                    count: p._count.plan
                })),
                locationDistribution: locationDistribution.map(l => ({
                    location: l.location,
                    count: l._count.location
                })),
                experienceDistribution: experienceDistribution.map(e => ({
                    years: e.yearsExperience,
                    count: e._count.yearsExperience
                })),
                topSkills: topSkills.map(([skill, count]) => ({ skill, count }))
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Admin data stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
