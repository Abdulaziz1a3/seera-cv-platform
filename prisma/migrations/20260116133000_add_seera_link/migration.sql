-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PASSWORD_PROTECTED');

-- CreateEnum
CREATE TYPE "ProfilePersona" AS ENUM ('JOBS', 'FREELANCE', 'NETWORKING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProfileTemplate" AS ENUM ('MINIMAL', 'BOLD');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CTAType" AS ENUM ('WHATSAPP', 'PHONE', 'EMAIL', 'LINKEDIN', 'DOWNLOAD_CV', 'VIEW_CV', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'CTA_CLICK', 'PDF_DOWNLOAD');

-- CreateTable
CREATE TABLE "seera_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "persona" "ProfilePersona" NOT NULL DEFAULT 'JOBS',
    "template" "ProfileTemplate" NOT NULL DEFAULT 'MINIMAL',
    "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "accessCode" TEXT,
    "noIndex" BOOLEAN NOT NULL DEFAULT false,
    "hidePhoneNumber" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "statusBadges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "language" TEXT NOT NULL DEFAULT 'en',
    "themeColor" TEXT NOT NULL DEFAULT 'sapphire',
    "customColors" JSONB,
    "sourceResumeId" TEXT,
    "enableDownloadCv" BOOLEAN NOT NULL DEFAULT false,
    "cvFileUrl" TEXT,
    "cvResumeId" TEXT,
    "ctaWhatsappNumber" TEXT,
    "ctaWhatsappMessage" TEXT DEFAULT 'Hi! I saw your Seera profile and would like to connect.',
    "ctaPhoneNumber" TEXT,
    "ctaEmail" TEXT,
    "ctaEmailSubject" TEXT DEFAULT 'Let''s Connect',
    "ctaEmailBody" TEXT,
    "ctaLinkedinUrl" TEXT,
    "enabledCtas" "CTAType"[] DEFAULT ARRAY['WHATSAPP', 'EMAIL', 'LINKEDIN']::"CTAType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "seera_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seera_profile_highlights" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seera_profile_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seera_profile_experiences" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "description" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seera_profile_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seera_profile_projects" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seera_profile_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seera_profile_certificates" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "date" TEXT,
    "url" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seera_profile_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seera_profile_analytics" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "eventType" "AnalyticsEventType" NOT NULL,
    "ctaType" "CTAType",
    "visitorHash" TEXT NOT NULL,
    "deviceType" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seera_profile_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserved_slugs" (
    "slug" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserved_slugs_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "seera_profiles_slug_key" ON "seera_profiles"("slug");
CREATE INDEX "seera_profiles_userId_idx" ON "seera_profiles"("userId");
CREATE INDEX "seera_profiles_slug_idx" ON "seera_profiles"("slug");
CREATE INDEX "seera_profiles_status_idx" ON "seera_profiles"("status");
CREATE INDEX "seera_profiles_visibility_idx" ON "seera_profiles"("visibility");

CREATE INDEX "seera_profile_highlights_profileId_idx" ON "seera_profile_highlights"("profileId");
CREATE INDEX "seera_profile_experiences_profileId_idx" ON "seera_profile_experiences"("profileId");
CREATE INDEX "seera_profile_projects_profileId_idx" ON "seera_profile_projects"("profileId");
CREATE INDEX "seera_profile_certificates_profileId_idx" ON "seera_profile_certificates"("profileId");

CREATE INDEX "seera_profile_analytics_profileId_idx" ON "seera_profile_analytics"("profileId");
CREATE INDEX "seera_profile_analytics_profileId_eventType_idx" ON "seera_profile_analytics"("profileId", "eventType");
CREATE INDEX "seera_profile_analytics_profileId_createdAt_idx" ON "seera_profile_analytics"("profileId", "createdAt");
CREATE INDEX "seera_profile_analytics_createdAt_idx" ON "seera_profile_analytics"("createdAt");

-- AddForeignKey
ALTER TABLE "seera_profiles" ADD CONSTRAINT "seera_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seera_profiles" ADD CONSTRAINT "seera_profiles_sourceResumeId_fkey" FOREIGN KEY ("sourceResumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "seera_profiles" ADD CONSTRAINT "seera_profiles_cvResumeId_fkey" FOREIGN KEY ("cvResumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seera_profile_highlights" ADD CONSTRAINT "seera_profile_highlights_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seera_profile_experiences" ADD CONSTRAINT "seera_profile_experiences_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seera_profile_projects" ADD CONSTRAINT "seera_profile_projects_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seera_profile_certificates" ADD CONSTRAINT "seera_profile_certificates_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seera_profile_analytics" ADD CONSTRAINT "seera_profile_analytics_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

