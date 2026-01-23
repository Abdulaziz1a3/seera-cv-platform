import { prisma } from '../src/lib/db';
import { deriveEducationProfile, deriveExperienceIndicators } from '../src/lib/education-utils';

function extractYearsExperience(experienceItems: any[] = []): number | null {
    const dates = experienceItems
        .map((exp) => exp.startDate)
        .filter(Boolean)
        .map((d) => new Date(d).getTime())
        .filter((t) => !Number.isNaN(t));

    if (!dates.length) return null;

    const earliest = Math.min(...dates);
    const years = (Date.now() - earliest) / (1000 * 60 * 60 * 24 * 365);
    return Math.max(0, Math.round(years));
}

async function main() {
    const batchSize = 100;
    let skip = 0;

    while (true) {
        const profiles = await prisma.talentProfile.findMany({
            skip,
            take: batchSize,
            include: {
                resume: {
                    include: {
                        versions: {
                            orderBy: { version: 'desc' },
                            take: 1,
                            select: { snapshot: true },
                        },
                    },
                },
            },
        });

        if (!profiles.length) break;

        for (const profile of profiles) {
            const snapshot = profile.resume?.versions[0]?.snapshot as any;
            if (!snapshot) continue;

            const experience = snapshot?.experience?.items || [];
            const education = snapshot?.education?.items || [];
            const projects = snapshot?.projects?.items || [];
            const certifications = snapshot?.certifications?.items || [];
            const yearsExperience = extractYearsExperience(experience);

            const educationProfile = deriveEducationProfile(education);
            const experienceIndicators = deriveExperienceIndicators({
                experienceItems: experience,
                projectItems: projects,
                educationItems: education,
                certificationItems: certifications,
                yearsExperience,
                graduationDate: educationProfile.graduationDate,
            });

            await prisma.talentProfile.update({
                where: { id: profile.id },
                data: {
                    highestDegreeLevel: educationProfile.highestDegreeLevel,
                    primaryFieldOfStudy: educationProfile.primaryFieldOfStudy,
                    normalizedFieldOfStudy: educationProfile.normalizedFieldOfStudy,
                    graduationYear: educationProfile.graduationYear,
                    graduationDate: educationProfile.graduationDate,
                    experienceBand: experienceIndicators.experienceBand,
                    internshipCount: experienceIndicators.internshipCount,
                    projectCount: experienceIndicators.projectCount,
                    freelanceCount: experienceIndicators.freelanceCount,
                    trainingFlag: experienceIndicators.trainingFlag,
                },
            });
        }

        skip += profiles.length;
    }
}

main()
    .catch((error) => {
        console.error('Backfill failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
