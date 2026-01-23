import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PLANS } from '@/lib/stripe';
import { createTuwaiqPayBill } from '@/lib/tuwaiqpay';
import { getUserPaymentProfile } from '@/lib/payments';
import { isEmailConfigured, sendPaymentLinkEmail } from '@/lib/email';
import { grantMonthlyCredits } from '@/lib/recruiter-credits';
import { RECRUITER_GROWTH_PLAN } from '@/lib/recruiter-billing';
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
        const status = searchParams.get('status') || 'all';
        const plan = searchParams.get('plan') || 'all';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        if (status !== 'all') {
            where.status = status.toUpperCase();
        }

        if (plan !== 'all') {
            where.plan = plan.toUpperCase();
        }

        // Get subscriptions
        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                orderBy: { createdAt: 'desc' },
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
                    }
                }
            }),
            prisma.subscription.count({ where })
        ]);

        // Calculate stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            activeCount,
            proCount,
            enterpriseCount,
            growthCount,
            canceledThisMonth,
            newThisMonth
        ] = await Promise.all([
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: { in: ['PRO', 'ENTERPRISE', 'GROWTH'] } }
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: 'PRO' }
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: 'ENTERPRISE' }
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE', plan: 'GROWTH' }
            }),
            prisma.subscription.count({
                where: {
                    status: 'CANCELED',
                    updatedAt: { gte: startOfMonth }
                }
            }),
            prisma.subscription.count({
                where: {
                    createdAt: { gte: startOfMonth },
                    plan: { in: ['PRO', 'ENTERPRISE', 'GROWTH'] }
                }
            })
        ]);

        // Calculate revenue
        const monthlyRevenue = (proCount * 39) + (enterpriseCount * 249) + (growthCount * 199);
        const arpu = activeCount > 0 ? monthlyRevenue / activeCount : 0;
        const churnRate = activeCount > 0 ? ((canceledThisMonth / activeCount) * 100) : 0;

        // Format subscriptions
        const formattedSubscriptions = subscriptions.map(sub => ({
            id: sub.id,
            user: {
                id: sub.user.id,
                name: sub.user.name || 'Unknown',
                email: sub.user.email,
                image: sub.user.image
            },
            plan: sub.plan,
            status: sub.status,
            amount: sub.plan === 'PRO' ? 39 : sub.plan === 'ENTERPRISE' ? 249 : sub.plan === 'GROWTH' ? 199 : 0,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt
        }));

        return NextResponse.json({
            subscriptions: formattedSubscriptions,
            stats: {
                monthlyRevenue: monthlyRevenue.toFixed(2),
                activeSubscribers: activeCount,
                churnRate: churnRate.toFixed(1),
                arpu: arpu.toFixed(2),
                proCount,
                enterpriseCount,
                newThisMonth
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin subscriptions error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscriptions' },
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
        const { subscriptionId, action, data } = body;

        if (!subscriptionId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'cancel':
                result = await prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        status: 'CANCELED',
                        cancelAtPeriodEnd: true
                    }
                });
                break;

            case 'reactivate':
                result = await prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        status: 'ACTIVE',
                        cancelAtPeriodEnd: false
                    }
                });
                break;

            case 'change_plan':
                result = await prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: { plan: data.plan }
                });
                break;

            case 'activate_full': {
                // Admin-initiated full subscription activation
                const { plan: activatePlan, duration, note } = data || {};
                
                if (!activatePlan || !['PRO', 'GROWTH'].includes(activatePlan)) {
                    return NextResponse.json({ error: 'Invalid plan specified' }, { status: 400 });
                }
                
                if (!duration || !['1_month', '3_months', '6_months', '1_year', 'lifetime'].includes(duration)) {
                    return NextResponse.json({ error: 'Invalid duration specified' }, { status: 400 });
                }
                
                const now = new Date();
                let periodEnd: Date;
                
                switch (duration) {
                    case '1_month':
                        periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                        break;
                    case '3_months':
                        periodEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
                        break;
                    case '6_months':
                        periodEnd = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
                        break;
                    case '1_year':
                        periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
                        break;
                    case 'lifetime':
                        // 100 years = effectively lifetime
                        periodEnd = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                }
                
                result = await prisma.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        status: 'ACTIVE',
                        plan: activatePlan,
                        currentPeriodStart: now,
                        currentPeriodEnd: periodEnd,
                        cancelAtPeriodEnd: false,
                    },
                    include: {
                        user: { select: { email: true, name: true } }
                    }
                });

                if (activatePlan === 'GROWTH') {
                    const durationMonths = duration === '1_month'
                        ? 1
                        : duration === '3_months'
                            ? 3
                            : duration === '6_months'
                                ? 6
                                : duration === '1_year'
                                    ? 12
                                    : duration === 'lifetime'
                                        ? 12
                                        : 1;
                    const credits = durationMonths === 12
                        ? RECRUITER_GROWTH_PLAN.yearlyCredits
                        : RECRUITER_GROWTH_PLAN.monthlyCredits * durationMonths;

                    await grantMonthlyCredits({
                        recruiterId: result.userId,
                        subscriptionId: result.id,
                        periodEnd,
                        amount: credits,
                        reference: `admin_activate:${result.id}:${duration}:${periodEnd.toISOString()}`,
                    });
                }
                
                // Enhanced audit log with activation details
                await prisma.auditLog.create({
                    data: {
                        userId: session.user.id,
                        action: 'subscription.admin_activate',
                        entity: 'Subscription',
                        entityId: subscriptionId,
                        details: {
                            action: 'activate_full',
                            plan: activatePlan,
                            duration,
                            periodStart: now.toISOString(),
                            periodEnd: periodEnd.toISOString(),
                            activatedUserEmail: (result as any).user?.email,
                            adminNote: note || null,
                            activatedBy: session.user.email,
                        }
                    }
                });
                
                // Return early to avoid duplicate audit log
                return NextResponse.json({ 
                    success: true, 
                    result: {
                        plan: activatePlan,
                        status: 'ACTIVE',
                        periodEnd: periodEnd.toISOString(),
                    }
                });
            }

            case 'send_invoice': {
                const subscription = await prisma.subscription.findUnique({
                    where: { id: subscriptionId },
                    include: {
                        user: { select: { email: true, name: true } }
                    }
                });

                if (!subscription) {
                    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
                }

                if (!isEmailConfigured()) {
                    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
                }

                const planKey = data?.plan === 'enterprise'
                    ? 'enterprise'
                    : data?.plan === 'pro'
                        ? 'pro'
                        : subscription.plan === 'ENTERPRISE'
                            ? 'enterprise'
                            : 'pro';
                const planConfig = PLANS[planKey];
                const interval = data?.interval === 'yearly' ? 'yearly' : 'monthly';
                const amountSar = interval === 'yearly' ? planConfig.priceYearly : planConfig.priceMonthly;
                const customer = await getUserPaymentProfile(subscription.userId);

                const bill = await createTuwaiqPayBill({
                    amountSar,
                    description: `Seera AI ${planConfig.name.en} (${interval})`,
                    customerName: customer.customerName,
                    customerMobilePhone: customer.customerPhone,
                });

                const payment = await prisma.paymentTransaction.create({
                    data: {
                        provider: 'TUWAIQPAY',
                        status: 'PENDING',
                        purpose: 'SUBSCRIPTION',
                        userId: subscription.userId,
                        amountSar,
                        plan: subscription.plan,
                        interval: interval === 'yearly' ? 'YEARLY' : 'MONTHLY',
                        providerTransactionId: bill.transactionId,
                        providerBillId: bill.billId ? bill.billId.toString() : undefined,
                        providerReference: bill.merchantTransactionId,
                        paymentLink: bill.link,
                        metadata: {
                            interval,
                            planId: planKey,
                            billExpiresAt: bill.expireDate,
                            issuedByAdmin: true,
                        },
                    },
                });

                const emailResult = await sendPaymentLinkEmail(
                    subscription.user.email,
                    bill.link,
                    subscription.user.name || undefined
                );

                if (!emailResult.success) {
                    return NextResponse.json({ error: emailResult.error || 'Failed to send invoice' }, { status: 500 });
                }

                result = { paymentUrl: payment.paymentLink };
                break;
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: `subscription.${action}`,
                entity: 'Subscription',
                entityId: subscriptionId,
                details: { action, data }
            }
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Admin subscription update error:', error);
        const message = error instanceof Error ? error.message : 'Failed to update subscription';
        const status = message === 'Phone number is required for payments' ? 400 : 500;
        return NextResponse.json(
            { error: message },
            { status }
        );
    }
}
