// Auth Configuration for Seera AI
// Edge-compatible configuration (no Prisma/Node.js specific imports)

import type { NextAuthConfig } from 'next-auth';

// Extend the built-in session types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            role: string;
            plan?: string;
        };
    }

    interface User {
        role?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        plan?: string;
    }
}

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://');
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
        signOut: '/login',
        error: '/login',
        newUser: '/dashboard',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    cookies: {
        sessionToken: {
            name: `${cookiePrefix}authjs.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: useSecureCookies,
            },
        },
    },
    trustHost: true,
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isOnAdminLogin = nextUrl.pathname === '/admin/login';
            const isOnAuth = nextUrl.pathname.startsWith('/login') ||
                           nextUrl.pathname.startsWith('/register') ||
                           nextUrl.pathname.startsWith('/forgot-password') ||
                           nextUrl.pathname.startsWith('/reset-password') ||
                           nextUrl.pathname.startsWith('/verify-email');
            const isOnRecruiters = nextUrl.pathname.startsWith('/recruiters');
            const isOnRecruiterAuth = nextUrl.pathname.startsWith('/recruiters/login') ||
                                    nextUrl.pathname.startsWith('/recruiters/register');
            const plan = auth?.user?.plan;
            const isRecruiterPlan = plan === 'GROWTH' || plan === 'ENTERPRISE';

            // Allow admin login page access
            if (isOnAdminLogin) {
                // If logged in as admin, redirect to admin dashboard
                if (isLoggedIn) {
                    const role = auth?.user?.role;
                    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
                        return Response.redirect(new URL('/admin', nextUrl));
                    }
                }
                return true;
            }

            // Redirect logged-in users away from auth pages
            if (isLoggedIn && isOnAuth) {
                const destination = isRecruiterPlan ? '/recruiters' : '/dashboard';
                return Response.redirect(new URL(destination, nextUrl));
            }

            // Protect dashboard routes
            if (isOnDashboard) {
                if (!isLoggedIn) return false;
                if (isRecruiterPlan) {
                    return Response.redirect(new URL('/recruiters', nextUrl));
                }
                return true;
            }

            if (isOnRecruiterAuth && isLoggedIn) {
                const destination = isRecruiterPlan ? '/recruiters' : '/dashboard';
                return Response.redirect(new URL(destination, nextUrl));
            }

            if (isOnRecruiters) {
                if (!isLoggedIn) {
                    return Response.redirect(new URL('/recruiters/login', nextUrl));
                }
                if (!isRecruiterPlan) {
                    return Response.redirect(new URL('/dashboard?error=recruiter_only', nextUrl));
                }
                return true;
            }

            // Protect admin routes - redirect to admin login
            if (isOnAdmin) {
                if (!isLoggedIn) {
                    return Response.redirect(new URL('/admin/login', nextUrl));
                }
                const role = auth?.user?.role;
                if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
                    return Response.redirect(new URL('/dashboard?error=unauthorized', nextUrl));
                }
                return true;
            }

            return true;
        },
        jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.id = user.id as string;
                token.role = user.role || 'USER';
            }

            // Handle session updates
            if (trigger === 'update' && session) {
                if (session.role) token.role = session.role;
            }

            return token;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
    },
    providers: [], // Providers are added in auth.ts
};
