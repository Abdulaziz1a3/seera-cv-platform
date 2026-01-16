import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { success, errors, handleError } from '@/lib/api-response';
import { slugSchema } from '@/lib/seera-link/schemas';
import { validateSlug, generateSlugSuggestions } from '@/lib/seera-link/utils';
import { checkRateLimit, getRateLimitKey, getClientIP, rateLimitConfigs } from '@/lib/seera-link/rate-limit';

// GET /api/seera-link/check-slug?slug=xxx&profileId=xxx
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    // Rate limit
    const headersList = headers();
    const ip = getClientIP(headersList);
    const rateLimitKey = getRateLimitKey('slug-check', session.user.id);
    const rateLimit = await checkRateLimit(
      rateLimitKey,
      rateLimitConfigs.slugCheck.limit,
      rateLimitConfigs.slugCheck.windowSeconds
    );

    if (!rateLimit.allowed) {
      return errors.rateLimited(rateLimitConfigs.slugCheck.windowSeconds);
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const profileId = searchParams.get('profileId'); // For excluding current profile on edit

    if (!slug) {
      return errors.validation([{ path: 'slug', message: 'Slug is required' }]);
    }

    // First validate format with Zod
    const formatResult = slugSchema.safeParse(slug);
    if (!formatResult.success) {
      const suggestions = generateSlugSuggestions(slug);
      return success({
        available: false,
        reason: formatResult.error.errors[0]?.message || 'Invalid slug format',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      });
    }

    // Then validate availability
    const validation = await validateSlug(formatResult.data, profileId || undefined);

    if (!validation.valid) {
      const suggestions = generateSlugSuggestions(slug);
      return success({
        available: false,
        reason: validation.error,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      });
    }

    return success({ available: true });
  } catch (error) {
    console.error('Error checking slug:', error);
    return handleError(error);
  }
}
