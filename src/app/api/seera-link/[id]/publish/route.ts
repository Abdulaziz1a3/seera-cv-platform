import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { success, errors, handleError } from '@/lib/api-response';
import { getProfileUrl } from '@/lib/seera-link/utils';
import { hasActiveSubscription } from '@/lib/subscription';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/seera-link/[id]/publish - Publish profile
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }
    const hasAccess = await hasActiveSubscription(session.user.id);
    if (!hasAccess) {
      return errors.subscriptionRequired('Seera Link');
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

    // Validate profile has minimum required data
    if (!profile.displayName || !profile.title) {
      return errors.validation([
        { path: 'profile', message: 'Profile must have a name and title to publish' },
      ]);
    }

    // Check if already published
    if (profile.status === 'PUBLISHED') {
      return success({
        published: true,
        slug: profile.slug,
        url: getProfileUrl(profile.slug),
        message: 'Profile is already published',
      });
    }

    // Publish
    await prisma.seeraProfile.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: profile.publishedAt || new Date(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PUBLISH',
        entity: 'SeeraProfile',
        entityId: id,
        details: { slug: profile.slug },
      },
    });

    return success({
      published: true,
      slug: profile.slug,
      url: getProfileUrl(profile.slug),
    });
  } catch (error) {
    console.error('Error publishing profile:', error);
    return handleError(error);
  }
}

// DELETE /api/seera-link/[id]/publish - Unpublish profile
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }
    const hasAccess = await hasActiveSubscription(session.user.id);
    if (!hasAccess) {
      return errors.subscriptionRequired('Seera Link');
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

    // Check if already draft
    if (profile.status === 'DRAFT') {
      return success({
        unpublished: true,
        message: 'Profile is already unpublished',
      });
    }

    // Unpublish
    await prisma.seeraProfile.update({
      where: { id },
      data: { status: 'DRAFT' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UNPUBLISH',
        entity: 'SeeraProfile',
        entityId: id,
        details: { slug: profile.slug },
      },
    });

    return success({ unpublished: true });
  } catch (error) {
    console.error('Error unpublishing profile:', error);
    return handleError(error);
  }
}
