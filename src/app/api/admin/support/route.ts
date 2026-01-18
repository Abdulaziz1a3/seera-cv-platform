import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isEmailConfigured, sendAdminEmail } from '@/lib/email';
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
        const status = searchParams.get('status') || 'all';
        const priority = searchParams.get('priority') || 'all';
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (status !== 'all') {
            where.status = status.toUpperCase();
        }

        if (priority !== 'all') {
            where.priority = priority.toUpperCase();
        }

        if (search) {
            where.OR = [
                { subject: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get tickets
        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    },
                    responses: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }),
            prisma.supportTicket.count({ where })
        ]);

        // Get stats
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));

        const [
            openCount,
            inProgressCount,
            closedToday,
            urgentCount
        ] = await Promise.all([
            prisma.supportTicket.count({ where: { status: 'OPEN' } }),
            prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.supportTicket.count({
                where: {
                    status: { in: ['RESOLVED', 'CLOSED'] },
                    resolvedAt: { gte: startOfDay }
                }
            }),
            prisma.supportTicket.count({
                where: {
                    priority: 'URGENT',
                    status: { in: ['OPEN', 'IN_PROGRESS'] }
                }
            })
        ]);

        // Calculate average response time
        const ticketsWithResponse = await prisma.supportTicket.findMany({
            where: {
                firstResponseAt: { not: null }
            },
            select: {
                createdAt: true,
                firstResponseAt: true
            },
            take: 100,
            orderBy: { createdAt: 'desc' }
        });

        let avgResponseTime = 0;
        if (ticketsWithResponse.length > 0) {
            const totalResponseTime = ticketsWithResponse.reduce((acc, t) => {
                if (t.firstResponseAt) {
                    return acc + (t.firstResponseAt.getTime() - t.createdAt.getTime());
                }
                return acc;
            }, 0);
            avgResponseTime = totalResponseTime / ticketsWithResponse.length / (1000 * 60 * 60); // hours
        }

        return NextResponse.json({
            tickets: tickets.map(t => ({
                id: t.id,
                subject: t.subject,
                message: t.message,
                email: t.email,
                status: t.status,
                priority: t.priority,
                category: t.category,
                user: t.user ? {
                    id: t.user.id,
                    name: t.user.name,
                    email: t.user.email,
                    image: t.user.image
                } : null,
                assignedTo: t.assignedTo,
                lastResponse: t.responses[0] || null,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
                resolvedAt: t.resolvedAt
            })),
            stats: {
                open: openCount,
                inProgress: inProgressCount,
                closedToday,
                urgent: urgentCount,
                avgResponseTime: avgResponseTime.toFixed(1)
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin support error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tickets' },
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
        const { ticketId, action, data } = body;

        if (!ticketId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let result;
        const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });

        if (!ticket) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        switch (action) {
            case 'reply':
                // Create response
                const response = await prisma.ticketResponse.create({
                    data: {
                        ticketId,
                        message: data.message,
                        isStaff: true,
                        authorId: session.user.id,
                        authorName: session.user.name || session.user.email
                    }
                });

                // Update ticket status and first response time
                const updateData: any = {
                    status: 'IN_PROGRESS'
                };

                if (!ticket.firstResponseAt) {
                    updateData.firstResponseAt = new Date();
                }

                result = await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: updateData
                });

                if (isEmailConfigured()) {
                    await sendAdminEmail({
                        to: ticket.email,
                        subject: `Support reply: ${ticket.subject}`,
                        heading: 'We responded to your ticket',
                        message: data.message,
                        name: ticket.user?.name || undefined,
                    });
                }
                break;

            case 'close':
                result = await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'CLOSED',
                        resolvedAt: new Date()
                    }
                });
                break;

            case 'resolve':
                result = await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'RESOLVED',
                        resolvedAt: new Date()
                    }
                });
                break;

            case 'reopen':
                result = await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        status: 'OPEN',
                        resolvedAt: null
                    }
                });
                break;

            case 'assign':
                result = await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: {
                        assignedTo: data.assignedTo,
                        status: 'IN_PROGRESS'
                    }
                });
                break;

            case 'change_priority':
                result = await prisma.supportTicket.update({
                    where: { id: ticketId },
                    data: { priority: data.priority }
                });
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: `ticket.${action}`,
                entity: 'SupportTicket',
                entityId: ticketId,
                details: { action, data }
            }
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Update ticket error:', error);
        return NextResponse.json(
            { error: 'Failed to update ticket' },
            { status: 500 }
        );
    }
}
