import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { adminSettingsSchema, defaultAdminSettings } from '@/lib/admin-settings';
import { sendAdminEmail, isEmailConfigured } from '@/lib/email';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
    return { session };
}

export async function GET() {
    const { session, error } = await requireAdmin();
    if (error) return error;

    const latest = await prisma.auditLog.findFirst({
        where: {
            action: 'system.settings.update',
            entity: 'SystemSettings',
        },
        orderBy: { createdAt: 'desc' },
    });

    const rawSettings = (latest?.details as { settings?: unknown } | null)?.settings ?? defaultAdminSettings;
    const parsed = adminSettingsSchema.safeParse(rawSettings);

    return NextResponse.json({
        settings: parsed.success ? parsed.data : defaultAdminSettings,
        updatedAt: latest?.createdAt || null,
        updatedBy: session.user.email,
    });
}

export async function PUT(request: NextRequest) {
    const { session, error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await request.json();
        const parsed = adminSettingsSchema.safeParse(body?.settings ?? body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid settings payload' }, { status: 400 });
        }

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'system.settings.update',
                entity: 'SystemSettings',
                entityId: 'default',
                details: { settings: parsed.data },
            },
        });

        return NextResponse.json({ success: true, settings: parsed.data });
    } catch (err) {
        console.error('Admin settings update error:', err);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { session, error } = await requireAdmin();
    if (error) return error;

    try {
        const body = await request.json();
        const email = body?.email || session.user.email;
        const subject = 'Seera AI admin email test';

        if (!isEmailConfigured()) {
            return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
        }

        const result = await sendAdminEmail({
            to: email,
            subject,
            heading: 'Email test successful',
            message: 'This is a test message from the Seera AI admin panel.',
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 500 });
        }

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'system.settings.email_test',
                entity: 'SystemSettings',
                entityId: 'default',
                details: { email },
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Admin settings test email error:', err);
        return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
    }
}
