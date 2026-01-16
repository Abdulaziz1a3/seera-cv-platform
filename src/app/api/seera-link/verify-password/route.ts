import { cookies, headers } from 'next/headers';
import { ZodError } from 'zod';
import { prisma } from '@/lib/db';
import { success, errors, handleZodError, handleError } from '@/lib/api-response';
import { verifyPasswordSchema } from '@/lib/seera-link/schemas';
import { verifyAccessCode } from '@/lib/seera-link/utils';
import { checkRateLimit, getRateLimitKey, getClientIP, rateLimitConfigs } from '@/lib/seera-link/rate-limit';

// POST /api/seera-link/verify-password
export async function POST(request: Request) {
  try {
    const headersList = headers();
    const ip = getClientIP(headersList);

    // Rate limit: 5 attempts per 15 minutes per IP
    const rateLimitKey = getRateLimitKey('password-verify', ip);
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      rateLimitConfigs.passwordVerify.limit,
      rateLimitConfigs.passwordVerify.windowSeconds
    );

    if (!rateLimit.allowed) {
      return errors.rateLimited(rateLimitConfigs.passwordVerify.windowSeconds);
    }

    const body = await request.json();
    const data = verifyPasswordSchema.parse(body);

    const normalizedSlug = data.slug.toLowerCase();

    // Find the profile
    const profile = await prisma.seeraProfile.findFirst({
      where: {
        slug: normalizedSlug,
        status: 'PUBLISHED',
        visibility: 'PASSWORD_PROTECTED',
        deletedAt: null,
      },
      select: { id: true, accessCode: true },
    });

    if (!profile || !profile.accessCode) {
      // Don't reveal if profile exists or not
      return errors.unauthorized('Invalid access code');
    }

    // Verify the access code
    const isValid = await verifyAccessCode(data.accessCode, profile.accessCode);

    if (!isValid) {
      return errors.unauthorized('Invalid access code');
    }

    // Set access cookie (24 hours)
    const cookieStore = cookies();
    cookieStore.set(`seera-link-access-${normalizedSlug}`, profile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: `/p/${normalizedSlug}`,
    });

    return success({ verified: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    console.error('Error verifying password:', error);
    return handleError(error);
  }
}
