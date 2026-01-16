import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { authConfig } from './auth.config';

// Super admin email - has full access to all features
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'info@seera-ai.com';

// Only include Google provider if credentials are configured
const providers: any[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        })
    );
}

providers.push(
    Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    console.log('[AUTH] Authorize called with email:', credentials?.email);

                    if (!credentials?.email || !credentials?.password) {
                        console.log('[AUTH] Missing credentials');
                        return null;
                    }

                    const email = credentials.email as string;
                    const password = credentials.password as string;

                    // Check if this is the super admin email
                    const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

                    let user = await prisma.user.findUnique({
                        where: { email: email.toLowerCase() },
                    });

                    // If super admin doesn't exist, create the account
                    if (!user && isSuperAdmin) {
                        const hashedPassword = await bcrypt.hash(password, 12);
                        user = await prisma.user.create({
                            data: {
                                email: email.toLowerCase(),
                                name: 'Super Admin',
                                passwordHash: hashedPassword,
                                emailVerified: new Date(),
                                role: 'SUPER_ADMIN',
                                profile: {
                                    create: {
                                        firstName: 'Super',
                                        lastName: 'Admin',
                                    },
                                },
                                subscription: {
                                    create: {
                                        plan: 'ENTERPRISE',
                                        status: 'ACTIVE',
                                    },
                                },
                            },
                        });
                        // Return immediately for first-time super admin creation
                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            role: 'SUPER_ADMIN',
                        };
                    }

                    if (!user || !user.passwordHash) {
                        console.log('[AUTH] User not found or no password hash');
                        return null;
                    }

                    console.log('[AUTH] User found:', user.email, 'emailVerified:', !!user.emailVerified);

                    const isValid = await bcrypt.compare(password, user.passwordHash);
                    if (!isValid) {
                        console.log('[AUTH] Invalid password');
                        return null;
                    }

                    // Super admin bypasses email verification
                    if (!user.emailVerified && !isSuperAdmin) {
                        console.log('[AUTH] Email not verified');
                        return null;
                    }

                    console.log('[AUTH] Login successful for:', user.email);

                    // Ensure super admin always has SUPER_ADMIN role
                    const role = isSuperAdmin ? 'SUPER_ADMIN' : user.role;

                    // Update role if needed for super admin
                    if (isSuperAdmin && user.role !== 'SUPER_ADMIN') {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { role: 'SUPER_ADMIN' },
                        });
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: role,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers,
    // We already defined callbacks in auth.config, but we need to override/extend the signIn callback
    // because it uses Prisma, which is not available in auth.config (Edge)
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }) {
            // For OAuth providers, create user profile and subscription if needed
            if (account?.provider === 'google' && user?.email) {
                try {
                    // Check if user exists
                    let dbUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });

                    if (!dbUser) {
                        // Create new user for OAuth
                        const isSuperAdmin = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

                        dbUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name,
                                image: user.image,
                                emailVerified: new Date(),
                                role: isSuperAdmin ? 'SUPER_ADMIN' : 'USER',
                                profile: {
                                    create: {
                                        firstName: user.name?.split(' ')[0] || '',
                                    },
                                },
                                subscription: {
                                    create: {
                                        plan: isSuperAdmin ? 'ENTERPRISE' : 'PRO',
                                        status: isSuperAdmin ? 'ACTIVE' : 'UNPAID',
                                    },
                                },
                            },
                        });
                    } else {
                        // If user exists, ensure super admin role is correct
                        const isSuperAdmin = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                        if (isSuperAdmin && dbUser.role !== 'SUPER_ADMIN') {
                            dbUser = await prisma.user.update({
                                where: { id: dbUser.id },
                                data: { role: 'SUPER_ADMIN' },
                            });
                        }
                    }

                    // Update the user object with the database ID
                    user.id = dbUser.id;
                } catch (error) {
                    console.error('OAuth sign in error:', error);
                    return false;
                }
            }
            return true;
        },
    },
});

// Helper functions for auth
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

export async function generateVerificationToken(
    email: string,
    type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' = 'EMAIL_VERIFICATION'
): Promise<string> {
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete existing tokens
    await prisma.verificationToken.deleteMany({
        where: { identifier: email, type },
    });

    // Create new token
    await prisma.verificationToken.create({
        data: {
            identifier: email,
            token,
            expires,
            type,
        },
    });

    return token;
}

export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            profile: true,
            subscription: true,
        },
    });

    return user;
}

export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }
    return session;
}

export async function requireAdmin() {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
        throw new Error('Forbidden');
    }
    return session;
}
