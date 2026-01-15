// Middleware for Seera AI
// Handles authentication, rate limiting, and security at the Edge

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// API routes that need rate limiting (requests per minute)
const rateLimitConfig: Record<string, number> = {
    '/api/ai': 20,
    '/api/career': 20,
    '/api/interview': 20,
    '/api/auth': 10,
    '/api': 100,
};

// Simple in-memory rate limiting for Edge
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(ip: string, path: string): string {
    for (const route of Object.keys(rateLimitConfig)) {
        if (path.startsWith(route)) {
            return `${ip}:${route}`;
        }
    }
    return `${ip}:/api`;
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number } {
    const key = getRateLimitKey(ip, path);
    const now = Date.now();
    const windowMs = 60000;

    let limit = 100;
    for (const [route, routeLimit] of Object.entries(rateLimitConfig)) {
        if (path.startsWith(route)) {
            limit = routeLimit;
            break;
        }
    }

    const existing = rateLimitMap.get(key);

    if (rateLimitMap.size > 10000) {
        const entries = Array.from(rateLimitMap.entries());
        for (const [k, v] of entries) {
            if (v.resetTime < now) {
                rateLimitMap.delete(k);
            }
        }
    }

    if (!existing || existing.resetTime < now) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
    }

    existing.count++;

    if (existing.count > limit) {
        return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: limit - existing.count };
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files and internal Next.js routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') ||
        pathname.startsWith('/favicon')
    ) {
        return NextResponse.next();
    }

    // Rate limiting for API routes only
    if (pathname.startsWith('/api')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

        const { allowed, remaining } = checkRateLimit(ip, pathname);

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests', code: 'RATE_LIMITED' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': '60',
                        'X-RateLimit-Remaining': '0',
                    }
                }
            );
        }

        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        return response;
    }

    // For auth checking, use AUTH_SECRET (NextAuth v5) with fallback to NEXTAUTH_SECRET
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

    // Routes configuration
    const protectedRoutes = ['/dashboard', '/resumes', '/career', '/interview', '/settings'];
    const adminRoutes = ['/admin'];
    const authRoutes = ['/login', '/register', '/forgot-password'];

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    const isAdminLogin = pathname === '/admin/login';

    // Skip auth check for admin login page
    if (isAdminLogin) {
        return NextResponse.next();
    }

    if (isProtectedRoute || isAuthRoute || isAdminRoute) {
        const token = await getToken({
            req: request,
            secret: secret,
            cookieName: process.env.NODE_ENV === 'production'
                ? '__Secure-authjs.session-token'
                : 'authjs.session-token',
        });

        // Protect admin routes
        if (isAdminRoute) {
            if (!token) {
                const loginUrl = new URL('/admin/login', request.url);
                return NextResponse.redirect(loginUrl);
            }

            const userRole = (token as any)?.role;
            if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
                return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
            }
        }

        // Redirect unauthenticated users to login
        if (isProtectedRoute && !token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Redirect authenticated users away from auth pages
        if (isAuthRoute && token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set('X-Request-ID', crypto.randomUUID());
    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
