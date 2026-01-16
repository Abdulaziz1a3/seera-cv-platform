import { ZodError } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { success, errors, handleZodError, handleError } from '@/lib/api-response';
import { generateFromResumeSchema } from '@/lib/seera-link/schemas';
import { generateSlugSuggestions, normalizeSaudiPhone } from '@/lib/seera-link/utils';

// Interface for resume section content
interface ContactContent {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

interface SummaryContent {
  text?: string;
}

interface ExperienceContent {
  entries?: Array<{
    company?: string;
    title?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
  }>;
}

interface CertificationContent {
  entries?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
    url?: string;
  }>;
}

interface ProjectContent {
  entries?: Array<{
    name?: string;
    description?: string;
    url?: string;
    technologies?: string[];
  }>;
}

// POST /api/seera-link/generate-from-resume - Generate profile data from resume
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const body = await request.json();
    const data = generateFromResumeSchema.parse(body);

    // Get the resume with all sections
    const resume = await prisma.resume.findFirst({
      where: {
        id: data.resumeId,
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!resume) {
      return errors.notFound('Resume');
    }

    // Extract data from resume sections
    const contactSection = resume.sections.find((s) => s.type === 'CONTACT');
    const summarySection = resume.sections.find((s) => s.type === 'SUMMARY');
    const experienceSection = resume.sections.find((s) => s.type === 'EXPERIENCE');
    const certificationsSection = resume.sections.find((s) => s.type === 'CERTIFICATIONS');
    const projectsSection = resume.sections.find((s) => s.type === 'PROJECTS');

    // Parse contact info
    const contact = contactSection?.content as ContactContent | undefined;
    const displayName = contact?.fullName || resume.title || 'Your Name';
    const email = contact?.email;
    const phone = normalizeSaudiPhone(contact?.phone);
    const location = contact?.location;
    const linkedinUrl = contact?.linkedin;

    // Parse summary/bio
    const summary = summarySection?.content as SummaryContent | undefined;
    const bio = summary?.text?.substring(0, 500);

    // Parse experiences
    const experienceContent = experienceSection?.content as ExperienceContent | undefined;
    const experiences = (experienceContent?.entries || [])
      .slice(0, 5)
      .map((exp, i) => ({
        company: exp.company || 'Company',
        role: exp.title || 'Role',
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        isFeatured: i === 0, // First experience is featured
        sortOrder: i,
      }));

    // Generate highlights from experience achievements
    const highlights: Array<{ content: string; icon?: string; sortOrder: number }> = [];
    let highlightIndex = 0;

    (experienceContent?.entries || []).forEach((exp) => {
      (exp.achievements || []).slice(0, 2).forEach((achievement) => {
        if (highlightIndex < 6 && achievement.length > 10) {
          highlights.push({
            content: achievement,
            icon: 'trophy',
            sortOrder: highlightIndex++,
          });
        }
      });
    });

    // Parse certifications
    const certificationsContent = certificationsSection?.content as CertificationContent | undefined;
    const certificates = (certificationsContent?.entries || [])
      .slice(0, 5)
      .map((cert, i) => ({
        name: cert.name || 'Certification',
        issuer: cert.issuer || 'Issuer',
        date: cert.date,
        url: cert.url,
        sortOrder: i,
      }));

    // Parse projects
    const projectsContent = projectsSection?.content as ProjectContent | undefined;
    const projects = (projectsContent?.entries || [])
      .slice(0, 5)
      .map((proj, i) => ({
        title: proj.name || 'Project',
        description: proj.description,
        url: proj.url,
        tags: proj.technologies || [],
        sortOrder: i,
      }));

    // Generate slug suggestions
    const slugSuggestions = generateSlugSuggestions(displayName);

    // Build profile data
    const profileData = {
      sourceResumeId: resume.id,
      displayName,
      title: resume.targetRole || experiences[0]?.role || 'Professional',
      location,
      bio,
      language: resume.language || 'en',
      themeColor: resume.theme || 'sapphire',

      // CTAs
      ctaEmail: email,
      ctaPhoneNumber: phone,
      ctaLinkedinUrl: linkedinUrl,
      ctaWhatsappNumber: phone,
      enabledCtas: [
        email && 'EMAIL',
        linkedinUrl && 'LINKEDIN',
        phone && 'WHATSAPP',
      ].filter(Boolean) as string[],

      // Content
      highlights,
      experiences,
      certificates,
      projects,

      // Suggestions
      slugSuggestions,
    };

    return success({
      profileData,
      resumeTitle: resume.title,
      message: 'Profile data generated from resume',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    console.error('Error generating from resume:', error);
    return handleError(error);
  }
}
