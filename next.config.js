/** @type {import('next').NextConfig} */

// Content Security Policy
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https: https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://api.openai.com https://vitals.vercel-insights.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
    {
        key: 'X-Frame-Options',
        value: 'DENY',
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(self), geolocation=(), browsing-topics=(), payment=(self)',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
    },
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
    },
    {
        key: 'Content-Security-Policy',
        value: ContentSecurityPolicy,
    },
];

const nextConfig = {
    // React strict mode for development
    reactStrictMode: true,

    // Enable SWC minification
    swcMinify: true,

    // Compiler options
    compiler: {
        // Remove console logs in production
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'seera-ai.com',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },

    // Experimental features
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
        // Optimize package imports
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            'date-fns',
            'recharts',
            'framer-motion',
        ],
    },

    // Webpack configuration
    webpack: (config, { isServer }) => {
        // Fix for canvas and other native modules
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
                canvas: false,
            };
        }

        // Handle .node files (for native modules)
        config.module.rules.push({
            test: /\.node$/,
            use: 'node-loader',
        });

        return config;
    },

    // Security headers
    async headers() {
        return [
            {
                // Apply security headers to all routes
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                // Cache static assets
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                // No cache for API routes
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, must-revalidate',
                    },
                ],
            },
        ];
    },

    // Redirects
    async redirects() {
        return [
            {
                source: '/home',
                destination: '/',
                permanent: true,
            },
            {
                source: '/templates',
                destination: '/',
                permanent: true,
            },
            {
                source: '/signup',
                destination: '/register',
                permanent: true,
            },
            {
                source: '/signin',
                destination: '/login',
                permanent: true,
            },
        ];
    },

    // Rewrites for clean URLs
    async rewrites() {
        return [
            {
                source: '/r/:slug',
                destination: '/resumes/public/:slug',
            },
        ];
    },

    // Output configuration for different deployment targets
    output: 'standalone',

    // Logging configuration
    logging: {
        fetches: {
            fullUrl: process.env.NODE_ENV === 'development',
        },
    },

    // TypeScript configuration
    typescript: {
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors. Only enable this if you're in a hurry!
        ignoreBuildErrors: false,
    },

    // ESLint configuration
    eslint: {
        // Don't run ESLint during production builds (already run in CI)
        ignoreDuringBuilds: false,
    },

    // Power Vercel deployment
    poweredByHeader: false,
};

module.exports = nextConfig;
