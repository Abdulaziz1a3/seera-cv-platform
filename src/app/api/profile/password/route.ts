import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword } = changePasswordSchema.parse(body);

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { passwordHash: true },
        });

        if (!user?.passwordHash) {
            return NextResponse.json(
                { error: 'Password not set for this account. Use the reset password flow.' },
                { status: 400 }
            );
        }

        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid password data', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Password update error:', error);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }
}
