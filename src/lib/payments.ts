import { prisma } from '@/lib/db';
import { normalizeSaudiPhone } from '@/lib/seera-link/utils';
import { isValidPhone } from '@/lib/utils';

export async function getUserPaymentProfile(userId: string): Promise<{
    userId: string;
    email: string;
    customerName: string;
    customerPhone: string;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    const fullName = user.name?.trim()
        || [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ').trim()
        || user.email;
    const customerName = fullName;

    const normalizedPhone = normalizeSaudiPhone(user.profile?.phone || '');
    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
        throw new Error('Phone number is required for payments');
    }
    const sanitizedPhone = normalizedPhone.replace(/[^\d+]/g, '');

    return {
        userId: user.id,
        email: user.email,
        customerName,
        customerPhone: sanitizedPhone,
    };
}
