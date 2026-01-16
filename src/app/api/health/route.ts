import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: 'ok' | 'error';
        memory: 'ok' | 'warning' | 'error';
    };
    details?: {
        database?: string;
        memory?: {
            heapUsed: number;
            heapTotal: number;
            external: number;
            rss: number;
        };
    };
}

export async function GET() {
    const startTime = Date.now();
    const health: HealthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        checks: {
            database: 'ok',
            memory: 'ok',
        },
    };

    // Check database connection
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.checks.database = 'ok';
    } catch (error) {
        health.checks.database = 'error';
        health.status = 'unhealthy';
        health.details = {
            ...health.details,
            database: error instanceof Error ? error.message : 'Database connection failed',
        };
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (heapUsedPercent > 90) {
        health.checks.memory = 'error';
        health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
    } else if (heapUsedPercent > 75) {
        health.checks.memory = 'warning';
        if (health.status === 'healthy') {
            health.status = 'degraded';
        }
    }

    health.details = {
        ...health.details,
        memory: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024),
        },
    };

    // Add response time
    const responseTime = Date.now() - startTime;

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(
        {
            ...health,
            responseTime: `${responseTime}ms`,
        },
        { status: statusCode }
    );
}
