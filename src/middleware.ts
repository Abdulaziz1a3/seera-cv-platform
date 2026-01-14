// Middleware for Seera AI
// Handles authentication, rate limiting, and security at the Edge

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/resumes', '/career', '/interview', '/settings'];

// Admin routes that require ADMIN or SUPER_ADMIN role
const adminRoutes = ['/admin'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

// API routes that need rate limiting (requests per minute)
const rateLimitConfig: Record<string, number> = {
    '/api/ai': 20,
    '/api/career': 20,
    '/api/interview': 20,
    '/api/auth': 10,
    '/api': 100,
};

// Simple in-memory rate limiting for Edge (use Redis in production for distributed)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(ip: string, path: string): string {
    // Get the most specific rate limit path
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
    const windowMs = 60000; // 1 minute

    // Get limit for this path
    let limit = 100;
    for (const [route, routeLimit] of Object.entries(rateLimitConfig)) {
        if (path.startsWith(route)) {
            limit = routeLimit;
            break;
        }
    }

    const existing = rateLimitMap.get(key);

    // Clean up old entries periodically
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

    // Rate limiting for API routes
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

        // Add rate limit headers to response
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        return response;
    }

    // Check authentication for protected routes
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute || isAuthRoute || isAdminRoute) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        // Protect admin routes - require authentication AND admin role
        if (isAdminRoute) {
            if (!token) {
                const loginUrl = new URL('/login', request.url);
                loginUrl.searchParams.set('callbackUrl', pathname);
                loginUrl.searchParams.set('admin', 'true');
                return NextResponse.redirect(loginUrl);
            }
            
            // Check if user has admin role
            const userRole = (token as any)?.role;
            if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
                // Redirect non-admin users to dashboard
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

    // Request ID for tracing
    const requestId = crypto.randomUUID();
    response.headers.set('X-Request-ID', requestId);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
