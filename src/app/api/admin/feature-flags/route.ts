import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const flags = await prisma.featureFlag.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Group flags by category (extract from key prefix)
        const groupedFlags = flags.reduce((acc: any, flag) => {
            const category = flag.key.split('_')[0].toUpperCase() || 'GENERAL';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push({
                id: flag.id,
                key: flag.key,
                name: flag.name,
                description: flag.description,
                enabled: flag.enabled,
                percentage: flag.percentage,
                enabledFor: flag.enabledFor,
                disabledFor: flag.disabledFor,
                createdAt: flag.createdAt,
                updatedAt: flag.updatedAt
            });
            return acc;
        }, {});

        // Calculate stats
        const totalFlags = flags.length;
        const enabledFlags = flags.filter(f => f.enabled).length;
        const partialRollouts = flags.filter(f => f.enabled && f.percentage < 100).length;

        return NextResponse.json({
            flags: groupedFlags,
            allFlags: flags.map(f => ({
                id: f.id,
                key: f.key,
                name: f.name,
                description: f.description,
                enabled: f.enabled,
                percentage: f.percentage,
                enabledFor: f.enabledFor,
                disabledFor: f.disabledFor,
                createdAt: f.createdAt,
                updatedAt: f.updatedAt
            })),
            stats: {
                total: totalFlags,
                enabled: enabledFlags,
                disabled: totalFlags - enabledFlags,
                partialRollouts
            }
        });
    } catch (error) {
        console.error('Feature flags error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feature flags' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized - Super Admin required' }, { status: 401 });
        }

        const body = await request.json();
        const { key, name, description, enabled, percentage } = body;

        if (!key || !name) {
            return NextResponse.json({ error: 'Key and name are required' }, { status: 400 });
        }

        // Check if key already exists
        const existing = await prisma.featureFlag.findUnique({ where: { key } });
        if (existing) {
            return NextResponse.json({ error: 'Feature flag with this key already exists' }, { status: 400 });
        }

        const flag = await prisma.featureFlag.create({
            data: {
                key,
                name,
                description,
                enabled: enabled || false,
                percentage: percentage || 100
            }
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: 'feature_flag.create',
                entity: 'FeatureFlag',
                entityId: flag.id,
                details: { key, name, enabled }
            }
        });

        return NextResponse.json({ success: true, flag });
    } catch (error) {
        console.error('Create feature flag error:', error);
        return NextResponse.json(
            { error: 'Failed to create feature flag' },
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
        const { id, action, data } = body;

        if (!id || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'toggle':
                const flag = await prisma.featureFlag.findUnique({ where: { id } });
                result = await prisma.featureFlag.update({
                    where: { id },
                    data: { enabled: !flag?.enabled }
                });
                break;

            case 'update':
                result = await prisma.featureFlag.update({
                    where: { id },
                    data: {
                        name: data.name,
                        description: data.description,
                        enabled: data.enabled,
                        percentage: data.percentage,
                        enabledFor: data.enabledFor || [],
                        disabledFor: data.disabledFor || []
                    }
                });
                break;

            case 'update_percentage':
                result = await prisma.featureFlag.update({
                    where: { id },
                    data: { percentage: data.percentage }
                });
                break;

            case 'delete':
                // Only super admin can delete
                if (session.user.role !== 'SUPER_ADMIN') {
                    return NextResponse.json({ error: 'Only Super Admin can delete flags' }, { status: 403 });
                }
                result = await prisma.featureFlag.delete({
                    where: { id }
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: `feature_flag.${action}`,
                entity: 'FeatureFlag',
                entityId: id,
                details: { action, data }
            }
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Update feature flag error:', error);
        return NextResponse.json(
            { error: 'Failed to update feature flag' },
            { status: 500 }
        );
    }
}
