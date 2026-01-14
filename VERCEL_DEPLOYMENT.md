# Vercel Deployment Guide for Seera AI

## 🚀 Quick Start

### Prerequisites
1. Vercel account (Abdulaziz1a3)
2. GitHub repository: `Abdulaziz1a3/seera-cv-platform`
3. PostgreSQL database (Vercel Postgres, Neon, or Supabase recommended)
4. Environment variables configured

## 📋 Step-by-Step Deployment

### 1. Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate with your Vercel account.

### 2. Link Project to Vercel
```bash
vercel link
```
- Select your existing project or create a new one
- Choose the appropriate scope (personal/team)
- Confirm the project settings

### 3. Set Environment Variables

Go to your Vercel project dashboard → Settings → Environment Variables and add:

#### **Required Variables:**

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database

# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-32-character-secret-key-here

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-...

# Stripe (Required for payments)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Optional but recommended)
RESEND_API_KEY=re_...
EMAIL_FROM=Seera AI <noreply@seera-ai.com>

# Redis (Optional - for rate limiting)
REDIS_URL=redis://...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Seera AI
SUPER_ADMIN_EMAIL=your-admin@email.com
```

#### **Optional Variables:**

```env
# Google OAuth (Optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Feature Flags
ENABLE_AI_GENERATION=true
ENABLE_LINKEDIN_IMPORT=false
ENABLE_2FA=false
MAINTENANCE_MODE=false

# Monitoring
SENTRY_DSN=https://...
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### 4. Deploy to Vercel

#### Option A: Deploy via CLI
```bash
vercel --prod
```

#### Option B: Deploy via GitHub Integration
1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Connect your GitHub repository: `Abdulaziz1a3/seera-cv-platform`
3. Enable automatic deployments on push to `main` branch

### 5. Run Database Migrations

After deployment, run Prisma migrations:

```bash
# Via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or via Vercel Dashboard → Functions → Run Command
npx prisma migrate deploy
```

### 6. Verify Deployment

1. Check build logs in Vercel Dashboard
2. Visit your deployment URL: `https://your-project.vercel.app`
3. Test critical features:
   - User registration/login
   - Resume creation
   - AI features (if configured)
   - Payment flow (if configured)

## 🔧 Build Configuration

The project is configured with:

- **Framework**: Next.js 14 (App Router)
- **Build Command**: `prisma generate && npm run build`
- **Install Command**: `npm install`
- **Output Directory**: `.next`
- **Node Version**: 18.x (auto-detected)
- **Region**: `iad1` (US East)

## 📊 Function Configuration

API routes are configured with appropriate timeouts:

- **Standard API routes**: 30 seconds
- **AI routes** (`/api/ai/**`): 60 seconds
- **Career routes** (`/api/career/**`): 60 seconds
- **Interview routes** (`/api/interview/**`): 60 seconds
- **Resume parsing**: 60 seconds
- **Stripe webhook**: 30 seconds

## 🗄️ Database Setup

### Recommended: Vercel Postgres

1. Go to Vercel Dashboard → Storage → Create Database
2. Select "Postgres"
3. Choose a region close to your users
4. Copy the connection strings to environment variables:
   - `DATABASE_URL` → Connection Pooling URL
   - `DIRECT_URL` → Direct Connection URL

### Alternative: Neon, Supabase, or Railway

1. Create a PostgreSQL database
2. Get connection strings
3. Add to Vercel environment variables

## 🔐 Security Headers

The project includes comprehensive security headers:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=63072000
- Content-Security-Policy: configured

## 🐛 Troubleshooting

### Build Fails

1. **Check build logs** in Vercel Dashboard
2. **Verify environment variables** are set correctly
3. **Check Prisma schema** compatibility
4. **Ensure Node version** is 18.x or higher

### Database Connection Issues

1. **Verify DATABASE_URL** format
2. **Check DIRECT_URL** for migrations
3. **Ensure database** is accessible from Vercel IPs
4. **Run migrations**: `npx prisma migrate deploy`

### API Routes Timeout

1. **Check function timeout** settings in `vercel.json`
2. **Optimize slow queries** or API calls
3. **Consider upgrading** to Pro plan for longer timeouts

### Environment Variables Not Working

1. **Redeploy** after adding new variables
2. **Check variable names** match exactly (case-sensitive)
3. **Verify scope** (Production/Preview/Development)

## 📈 Performance Optimization

### Already Configured:

- ✅ Image optimization with Next.js Image component
- ✅ Static asset caching (1 year)
- ✅ API route caching disabled
- ✅ SWC minification enabled
- ✅ Console logs removed in production
- ✅ Package import optimization

### Recommended:

- Enable Vercel Analytics
- Set up Vercel Speed Insights
- Configure CDN caching for static assets
- Use Edge Functions for high-traffic routes

## 🔄 Continuous Deployment

With GitHub integration enabled:

- **Main branch** → Production deployment
- **Pull requests** → Preview deployments
- **Automatic** → On every push

## 📝 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] Stripe webhook URL updated
- [ ] Email service configured
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Performance monitoring active

## 🆘 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review build output
3. Verify environment variables
4. Check database connectivity
5. Review Next.js documentation

## 🎉 Success!

Your Seera AI application should now be live on Vercel!

**Next Steps:**
1. Set up a custom domain
2. Configure monitoring and analytics
3. Set up CI/CD workflows
4. Optimize performance based on usage
