import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
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

        const skip = (page - 1) * limit;

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
                take: limit,
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
        const { userId, action, data } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'update':
                result = await prisma.user.update({
                    where: { id: userId },
                    data: {
                        name: data.name,
                        role: data.role,
                    }
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

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: `user.${action}`,
                entity: 'User',
                entityId: userId,
                details: { action, data }
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
