import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { success, errors, handleZodError, handleError } from '@/lib/api-response';
import { updateProfileSchema } from '@/lib/seera-link/schemas';
import { validateSlug, hashAccessCode, normalizeSaudiPhone } from '@/lib/seera-link/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/seera-link/[id] - Get single profile
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        highlights: { orderBy: { sortOrder: 'asc' } },
        experiences: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
        certificates: { orderBy: { sortOrder: 'asc' } },
        sourceResume: {
          select: { id: true, title: true },
        },
        cvResume: {
          select: { id: true, title: true },
        },
      },
    });

    if (!profile) {
      return errors.notFound('Profile');
    }

    return success(profile);
  } catch (error) {
    console.error('Error fetching Seera profile:', error);
    return handleError(error);
  }
}

// PATCH /api/seera-link/[id] - Update profile
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    // Check ownership
    const existing = await prisma.seeraProfile.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errors.notFound('Profile');
    }

    const body = await request.json();
    const normalizedBody = {
      ...body,
      ctaWhatsappNumber: normalizeSaudiPhone(body.ctaWhatsappNumber),
      ctaPhoneNumber: normalizeSaudiPhone(body.ctaPhoneNumber),
    };
    const data = updateProfileSchema.parse({ ...normalizedBody, id });

    // Validate slug if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugValidation = await validateSlug(data.slug, id);
      if (!slugValidation.valid) {
        return errors.validation([
          { path: 'slug', message: slugValidation.error || 'Invalid slug' },
        ]);
      }
    }

    // Handle access code update
    let accessCodeUpdate: { accessCode: string | null } | Record<string, never> = {};
    if (data.accessCode !== undefined) {
      if (data.accessCode && data.visibility === 'PASSWORD_PROTECTED') {
        accessCodeUpdate = { accessCode: await hashAccessCode(data.accessCode) };
      } else if (data.visibility !== 'PASSWORD_PROTECTED') {
        accessCodeUpdate = { accessCode: null };
      }
    }

    // Update profile with transaction for nested data
    const profile = await prisma.$transaction(async (tx) => {
      // Delete existing nested records if provided in update
      if (data.highlights !== undefined) {
        await tx.seeraProfileHighlight.deleteMany({ where: { profileId: id } });
      }
      if (data.experiences !== undefined) {
        await tx.seeraProfileExperience.deleteMany({ where: { profileId: id } });
      }
      if (data.projects !== undefined) {
        await tx.seeraProfileProject.deleteMany({ where: { profileId: id } });
      }
      if (data.certificates !== undefined) {
        await tx.seeraProfileCertificate.deleteMany({ where: { profileId: id } });
      }

      // Build update data
      const updateData: Record<string, unknown> = {
        ...accessCodeUpdate,
        updatedAt: new Date(),
      };

      // Only include defined fields
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.persona !== undefined) updateData.persona = data.persona;
      if (data.template !== undefined) updateData.template = data.template;
      if (data.visibility !== undefined) updateData.visibility = data.visibility;
      if (data.noIndex !== undefined) updateData.noIndex = data.noIndex;
      if (data.hidePhoneNumber !== undefined) updateData.hidePhoneNumber = data.hidePhoneNumber;
      if (data.displayName !== undefined) updateData.displayName = data.displayName;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl || null;
      if (data.statusBadges !== undefined) updateData.statusBadges = data.statusBadges;
      if (data.language !== undefined) updateData.language = data.language;
      if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
      if (data.sourceResumeId !== undefined) updateData.sourceResumeId = data.sourceResumeId;
      if (data.enableDownloadCv !== undefined) updateData.enableDownloadCv = data.enableDownloadCv;
      if (data.cvFileUrl !== undefined) updateData.cvFileUrl = data.cvFileUrl || null;
      if (data.cvResumeId !== undefined) updateData.cvResumeId = data.cvResumeId;
      if (data.ctaWhatsappNumber !== undefined) updateData.ctaWhatsappNumber = data.ctaWhatsappNumber;
      if (data.ctaWhatsappMessage !== undefined) updateData.ctaWhatsappMessage = data.ctaWhatsappMessage;
      if (data.ctaPhoneNumber !== undefined) updateData.ctaPhoneNumber = data.ctaPhoneNumber;
      if (data.ctaEmail !== undefined) updateData.ctaEmail = data.ctaEmail || null;
      if (data.ctaEmailSubject !== undefined) updateData.ctaEmailSubject = data.ctaEmailSubject;
      if (data.ctaEmailBody !== undefined) updateData.ctaEmailBody = data.ctaEmailBody;
      if (data.ctaLinkedinUrl !== undefined) updateData.ctaLinkedinUrl = data.ctaLinkedinUrl || null;
      if (data.enabledCtas !== undefined) updateData.enabledCtas = data.enabledCtas;

      // Add nested creates if provided
      if (data.highlights !== undefined) {
        updateData.highlights = {
          create: data.highlights.map((h, i) => ({
            content: h.content,
            icon: h.icon,
            sortOrder: h.sortOrder ?? i,
          })),
        };
      }
      if (data.experiences !== undefined) {
        updateData.experiences = {
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
        };
      }
      if (data.projects !== undefined) {
        updateData.projects = {
          create: data.projects.map((p, i) => ({
            title: p.title,
            description: p.description,
            url: p.url || null,
            imageUrl: p.imageUrl || null,
            tags: p.tags,
            sortOrder: p.sortOrder ?? i,
          })),
        };
      }
      if (data.certificates !== undefined) {
        updateData.certificates = {
          create: data.certificates.map((c, i) => ({
            name: c.name,
            issuer: c.issuer,
            date: c.date,
            url: c.url || null,
            sortOrder: c.sortOrder ?? i,
          })),
        };
      }

      // Update profile
      return tx.seeraProfile.update({
        where: { id },
        data: updateData,
        include: {
          highlights: { orderBy: { sortOrder: 'asc' } },
          experiences: { orderBy: { sortOrder: 'asc' } },
          projects: { orderBy: { sortOrder: 'asc' } },
          certificates: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return success(profile);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    console.error('Error updating Seera profile:', error);
    return handleError(error);
  }
}

// DELETE /api/seera-link/[id] - Soft delete profile
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!profile) {
      return errors.notFound('Profile');
    }

    // Soft delete
    await prisma.seeraProfile.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entity: 'SeeraProfile',
        entityId: id,
        details: { slug: profile.slug },
      },
    });

    return success({ deleted: true, id });
  } catch (error) {
    console.error('Error deleting Seera profile:', error);
    return handleError(error);
  }
}
