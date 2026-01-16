import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { success, errors, handleZodError, handleError } from '@/lib/api-response';
import { createProfileSchema } from '@/lib/seera-link/schemas';
import { validateSlug, hashAccessCode, canCreateProfile, normalizeSaudiPhone } from '@/lib/seera-link/utils';
import { checkRateLimit, getRateLimitKey, getClientIP, rateLimitConfigs } from '@/lib/seera-link/rate-limit';
import { headers } from 'next/headers';

// GET /api/seera-link - List user's profiles
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const profiles = await prisma.seeraProfile.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        highlights: {
          orderBy: { sortOrder: 'asc' },
          take: 3,
        },
        _count: {
          select: {
            analytics: {
              where: {
                eventType: 'PAGE_VIEW',
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Transform response
    const profilesWithStats = profiles.map((profile) => ({
      id: profile.id,
      slug: profile.slug,
      displayName: profile.displayName,
      title: profile.title,
      avatarUrl: profile.avatarUrl,
      persona: profile.persona,
      template: profile.template,
      status: profile.status,
      visibility: profile.visibility,
      language: profile.language,
      themeColor: profile.themeColor,
      highlights: profile.highlights,
      viewsLast7Days: profile._count.analytics,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      publishedAt: profile.publishedAt,
    }));

    return success(profilesWithStats);
  } catch (error) {
    console.error('Error fetching Seera profiles:', error);
    return handleError(error);
  }
}

// POST /api/seera-link - Create new profile
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    // Rate limiting
    const headersList = headers();
    const ip = getClientIP(headersList);
    const rateLimitKey = getRateLimitKey('create-profile', session.user.id);
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      rateLimitConfigs.createProfile.limit,
      rateLimitConfigs.createProfile.windowSeconds
    );

    if (!rateLimit.allowed) {
      return errors.rateLimited(rateLimitConfigs.createProfile.windowSeconds);
    }

    // Check plan limits
    const limits = await canCreateProfile(session.user.id);
    if (!limits.allowed) {
      return errors.subscriptionRequired(
        `You've reached your profile limit (${limits.max}). Upgrade to create more profiles.`
      );
    }

    const body = await request.json();
    const normalizedBody = {
      ...body,
      ctaWhatsappNumber: normalizeSaudiPhone(body.ctaWhatsappNumber),
      ctaPhoneNumber: normalizeSaudiPhone(body.ctaPhoneNumber),
    };
    const data = createProfileSchema.parse(normalizedBody);

    // Validate slug
    const slugValidation = await validateSlug(data.slug);
    if (!slugValidation.valid) {
      return errors.validation([
        { path: 'slug', message: slugValidation.error || 'Invalid slug' },
      ]);
    }

    // Hash access code if provided for password-protected profiles
    let hashedAccessCode: string | null = null;
    if (data.accessCode && data.visibility === 'PASSWORD_PROTECTED') {
      hashedAccessCode = await hashAccessCode(data.accessCode);
    }

    // Create profile with nested data
    const profile = await prisma.seeraProfile.create({
      data: {
        userId: session.user.id,
        slug: data.slug,
        persona: data.persona,
        template: data.template,
        visibility: data.visibility,
        accessCode: hashedAccessCode,
        noIndex: data.noIndex,
        hidePhoneNumber: data.hidePhoneNumber,
        displayName: data.displayName,
        title: data.title,
        location: data.location,
        bio: data.bio,
        avatarUrl: data.avatarUrl || null,
        statusBadges: data.statusBadges,
        language: data.language,
        themeColor: data.themeColor,
        sourceResumeId: data.sourceResumeId,
        enableDownloadCv: data.enableDownloadCv,
        cvFileUrl: data.cvFileUrl || null,
        cvResumeId: data.cvResumeId,
        ctaWhatsappNumber: data.ctaWhatsappNumber,
        ctaWhatsappMessage: data.ctaWhatsappMessage,
        ctaPhoneNumber: data.ctaPhoneNumber,
        ctaEmail: data.ctaEmail || null,
        ctaEmailSubject: data.ctaEmailSubject,
        ctaEmailBody: data.ctaEmailBody,
        ctaLinkedinUrl: data.ctaLinkedinUrl || null,
        enabledCtas: data.enabledCtas,
        highlights: {
          create: data.highlights.map((h, i) => ({
            content: h.content,
            icon: h.icon,
            sortOrder: h.sortOrder ?? i,
          })),
        },
        experiences: {
          create: data.experiences.map((e, i) => ({
            company: e.company,
            role: e.role,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            description: e.description,
            isFeatured: e.isFeatured,
            sortOrder: e.sortOrder ?? i,
          })),
        },
        projects: {
          create: data.projects.map((p, i) => ({
            title: p.title,
            description: p.description,
            url: p.url || null,
            imageUrl: p.imageUrl || null,
            tags: p.tags,
            sortOrder: p.sortOrder ?? i,
          })),
        },
        certificates: {
          create: data.certificates.map((c, i) => ({
            name: c.name,
            issuer: c.issuer,
            date: c.date,
            url: c.url || null,
            sortOrder: c.sortOrder ?? i,
          })),
        },
      },
      include: {
        highlights: { orderBy: { sortOrder: 'asc' } },
        experiences: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
        certificates: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'SeeraProfile',
        entityId: profile.id,
        details: { slug: data.slug, persona: data.persona },
      },
    });

    return success(profile, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    console.error('Error creating Seera profile:', error);
    return handleError(error);
  }
}
