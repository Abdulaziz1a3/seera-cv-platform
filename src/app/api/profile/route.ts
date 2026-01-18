import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { normalizeSaudiPhone } from '@/lib/seera-link/utils';
import { isValidPhone } from '@/lib/utils';

const profileSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().optional(),
    image: z.union([z.string(), z.null()]).optional(),
});

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { profile: true },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
        name: user.name || '',
        email: user.email,
        phone: user.profile?.phone || '',
        image: user.image || '',
    });
}

export async function PUT(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const data = profileSchema.parse(body);
        const updates: { name?: string; image?: string | null } = {};
        if (data.name?.trim()) {
            updates.name = data.name.trim();
        }

        if (data.image !== undefined) {
            const imageValue = data.image;
            if (!imageValue) {
                updates.image = null;
            } else if (!imageValue.startsWith('data:image/')) {
                return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
            } else {
                const base64 = imageValue.split(',')[1] || '';
                const byteLength = Buffer.byteLength(base64, 'base64');
                const maxBytes = 2 * 1024 * 1024;
                if (byteLength > maxBytes) {
                    return NextResponse.json({ error: 'Image exceeds 2MB limit' }, { status: 400 });
                }
                updates.image = imageValue;
            }
        }

        let normalizedPhone: string | null | undefined = undefined;
        if (data.phone !== undefined) {
            const trimmed = data.phone.trim();
            if (!trimmed) {
                normalizedPhone = null;
            } else {
                const normalized = normalizeSaudiPhone(trimmed);
                if (!normalized || !isValidPhone(normalized)) {
                    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
                }
                normalizedPhone = normalized;
            }
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                ...updates,
                profile: normalizedPhone !== undefined
                    ? {
                          upsert: {
                              create: { phone: normalizedPhone },
                              update: { phone: normalizedPhone },
                          },
                      }
                    : undefined,
            },
            include: { profile: true },
        });

        return NextResponse.json({
            name: user.name || '',
            email: user.email,
            phone: user.profile?.phone || '',
            image: user.image || '',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
