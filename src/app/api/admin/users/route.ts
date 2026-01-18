import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateVerificationToken } from '@/lib/auth';
import { isEmailConfigured, sendAdminEmail, sendPasswordResetEmail } from '@/lib/email';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const plan = searchParams.get('plan') || 'all';
        const status = searchParams.get('status') || 'all';
        const exportFormat = searchParams.get('export') || '';

        const exportLimit = Math.min(parseInt(searchParams.get('limit') || '1000'), 10000);
        const skip = exportFormat ? 0 : (page - 1) * limit;
        const take = exportFormat ? exportLimit : limit;

        // Build where clause
        const where: any = {
            deletedAt: null,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (plan !== 'all') {
            where.subscription = {
                plan: plan.toUpperCase()
            };
        }

        if (status === 'active') {
            where.emailVerified = { not: null };
        } else if (status === 'suspended') {
            where.deletedAt = { not: null };
        }

        // Get users with counts
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    subscription: {
                        select: { plan: true, status: true }
                    },
                    profile: {
                        select: { firstName: true, lastName: true }
                    },
                    _count: {
                        select: { resumes: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        // Get last active from sessions or audit logs
        const userIds = users.map(u => u.id);
        const lastActivities = await prisma.auditLog.groupBy({
            by: ['userId'],
            where: {
                userId: { in: userIds }
            },
            _max: {
                createdAt: true
            }
        });

        const lastActiveMap = new Map(
            lastActivities.map(a => [a.userId, a._max.createdAt])
        );

        const formattedUsers = users.map(user => ({
            id: user.id,
            name: user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown',
            email: user.email,
            image: user.image,
            role: user.role,
            plan: user.subscription?.plan || 'FREE',
            subscriptionStatus: user.subscription?.status || 'ACTIVE',
            status: user.deletedAt ? 'suspended' : (user.emailVerified ? 'active' : 'pending'),
            resumes: user._count.resumes,
            createdAt: user.createdAt,
            lastActive: lastActiveMap.get(user.id) || user.updatedAt
        }));

        if (exportFormat === 'csv') {
            const header = [
                'Name',
                'Email',
                'Role',
                'Plan',
                'Status',
                'Resumes',
                'Joined',
                'Last Active',
            ];
            const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
            const rows = formattedUsers.map((user) => [
                escapeCsv(user.name),
                escapeCsv(user.email),
                escapeCsv(user.role),
                escapeCsv(user.plan),
                escapeCsv(user.status),
                user.resumes.toString(),
                new Date(user.createdAt).toISOString(),
                new Date(user.lastActive).toISOString(),
            ]);
            const csv = [header, ...rows].map((row) => row.join(',')).join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': 'attachment; filename="users-export.csv"',
                },
            });
        }

        return NextResponse.json({
            users: formattedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, userIds, action, data } = body;

        if ((!userId && !userIds) || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const targetIds = Array.isArray(userIds)
            ? userIds
            : userId
                ? [userId]
                : [];

        let result: any;

        switch (action) {
            case 'update':
                if (data?.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
                    return NextResponse.json({ error: 'Only super admins can grant SUPER_ADMIN' }, { status: 403 });
                }

                result = await prisma.$transaction(async (tx) => {
                    const updatedUser = await tx.user.update({
                        where: { id: userId },
                        data: {
                            name: data.name,
                            role: data.role,
                        }
                    });

                    if (data?.plan) {
                        await tx.subscription.upsert({
                            where: { userId },
                            update: { plan: data.plan },
                            create: {
                                userId,
                                plan: data.plan,
                                status: 'ACTIVE'
                            }
                        });
                    }

                    return updatedUser;
                });
                break;

            case 'suspend':
                result = await prisma.user.update({
                    where: { id: userId },
                    data: { deletedAt: new Date() }
                });
                break;

            case 'activate':
                result = await prisma.user.update({
                    where: { id: userId },
                    data: { deletedAt: null }
                });
                break;

            case 'delete':
                // Soft delete
                result = await prisma.user.update({
                    where: { id: userId },
                    data: { deletedAt: new Date() }
                });
                break;

            case 'change_plan':
                result = await prisma.subscription.upsert({
                    where: { userId },
                    update: { plan: data.plan },
                    create: {
                        userId,
                        plan: data.plan,
                        status: 'ACTIVE'
                    }
                });
                break;

            case 'reset_password': {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    return NextResponse.json({ error: 'User not found' }, { status: 404 });
                }

                const token = await generateVerificationToken(user.email, 'PASSWORD_RESET');
                if (isEmailConfigured()) {
                    const emailResult = await sendPasswordResetEmail(user.email, token, user.name || undefined);
                    if (!emailResult.success) {
                        return NextResponse.json({ error: emailResult.error || 'Failed to send reset email' }, { status: 500 });
                    }
                } else {
                    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
                }

                result = { email: user.email };
                break;
            }

            case 'send_email': {
                if (!isEmailConfigured()) {
                    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
                }
                if (!data?.subject || !data?.message) {
                    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
                }

                const recipients = await prisma.user.findMany({
                    where: { id: { in: targetIds } },
                    select: { id: true, email: true, name: true }
                });

                const results = await Promise.allSettled(
                    recipients.map((recipient) =>
                        sendAdminEmail({
                            to: recipient.email,
                            subject: data.subject,
                            heading: data.subject,
                            message: data.message,
                            name: recipient.name || undefined
                        })
                    )
                );

                const failures = results.filter((res) =>
                    res.status === 'rejected' || (res.status === 'fulfilled' && !res.value.success)
                );
                result = { sent: recipients.length - failures.length, failed: failures.length };
                break;
            }

            case 'bulk_suspend': {
                const updated = await prisma.user.updateMany({
                    where: {
                        id: { in: targetIds },
                        role: { not: 'SUPER_ADMIN' }
                    },
                    data: { deletedAt: new Date() }
                });
                result = { updated: updated.count };
                break;
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: `user.${action}`,
                entity: 'User',
                entityId: userId || targetIds[0],
                details: { action, data, targetIds }
            }
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Admin user update error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}
