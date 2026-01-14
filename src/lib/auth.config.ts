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
    }
}

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
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');
            const isOnAuth = nextUrl.pathname.startsWith('/login') ||
                           nextUrl.pathname.startsWith('/register') ||
                           nextUrl.pathname.startsWith('/forgot-password') ||
                           nextUrl.pathname.startsWith('/reset-password') ||
                           nextUrl.pathname.startsWith('/verify-email');

            // Redirect logged-in users away from auth pages
            if (isLoggedIn && isOnAuth) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }

            // Protect dashboard routes
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            // Protect admin routes
            if (isOnAdmin) {
                if (!isLoggedIn) return false;
                const role = auth?.user?.role;
                if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
                    return Response.redirect(new URL('/dashboard', nextUrl));
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
