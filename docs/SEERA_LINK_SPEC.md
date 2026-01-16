# Seera Link - Complete Feature Specification

## Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [Product Specification](#2-product-specification)
3. [Data Model](#3-data-model)
4. [API Layer](#4-api-layer)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Security Checklist](#6-security-checklist)
7. [Implementation Plan](#7-implementation-plan)
8. [Testing Plan](#8-testing-plan)

---

## 1. High-Level Architecture

### Overview
Seera Link is a public profile page system that allows users to create shareable career landing pages. Each profile is accessible via a custom slug URL (`/p/{slug}`) and can be customized with different personas, templates, and privacy settings.

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────────┐
│                         SEERA LINK ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌───────────────────┐    ┌──────────────┐ │
│  │   Dashboard UI   │───▶│   API Routes      │───▶│   Postgres   │ │
│  │  (Create/Edit)   │    │  (Next.js API)    │    │   (Supabase) │ │
│  └──────────────────┘    └───────────────────┘    └──────────────┘ │
│           │                       │                       │         │
│           │                       │                       │         │
│           ▼                       ▼                       ▼         │
│  ┌──────────────────┐    ┌───────────────────┐    ┌──────────────┐ │
│  │   Live Preview   │    │   Analytics API   │    │ Analytics DB │ │
│  │   (Real-time)    │    │   (Events Ingestion)   │ (Events Table)│ │
│  └──────────────────┘    └───────────────────┘    └──────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    PUBLIC PROFILE PAGE                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │
│  │  │  /p/{slug}  │  │   SSR +     │  │  Analytics Beacon   │   │  │
│  │  │   Route     │──│   Caching   │──│  (Client-side POST) │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Dashboard Module** (`/dashboard/seera-link`)
   - Profile list view
   - Create/Edit flow with live preview
   - Analytics dashboard
   - QR code generation

2. **Public Profile Route** (`/p/[slug]`)
   - Server-rendered with ISR (Incremental Static Regeneration)
   - Password protection middleware
   - Analytics beacon injection
   - SEO meta tags (or noindex based on settings)

3. **Analytics System**
   - Client-side event tracking
   - Privacy-friendly storage (hashed IP)
   - UTM parameter capture
   - Dashboard aggregation queries

4. **Template Engine**
   - Two base templates: Minimal, Bold
   - Theme customization (colors from resume themes)
   - RTL/LTR layout support

---

## 2. Product Specification

### 2.1 User Stories

#### Epic: Profile Creation
| ID | Story | Priority |
|----|-------|----------|
| US-001 | As a user, I want to create a Seera Link profile so that I can share a professional landing page | P0 |
| US-002 | As a user, I want to auto-generate my profile from an existing resume so that setup is quick | P0 |
| US-003 | As a user, I want to choose a unique slug/URL for my profile so that it's memorable | P0 |
| US-004 | As a user, I want to see a live preview while editing so I know how it will look | P0 |
| US-005 | As a user, I want to create multiple profiles (personas) for different purposes | P1 |
| US-006 | As a user, I want to select from pre-designed templates so my profile looks professional | P0 |

#### Epic: Profile Content
| ID | Story | Priority |
|----|-------|----------|
| US-010 | As a user, I want to add my name, title, location, and bio to my profile | P0 |
| US-011 | As a user, I want to add 3-8 highlight achievements with metrics | P0 |
| US-012 | As a user, I want to display my top work experiences | P1 |
| US-013 | As a user, I want to add portfolio/project links | P2 |
| US-014 | As a user, I want to show my certifications | P2 |
| US-015 | As a user, I want to add status badges (Open to work, Freelance, etc.) | P1 |
| US-016 | As a user, I want to switch my profile language between English and Arabic | P0 |

#### Epic: Contact Actions (CTAs)
| ID | Story | Priority |
|----|-------|----------|
| US-020 | As a visitor, I want to contact the profile owner via WhatsApp with a prefilled message | P0 |
| US-021 | As a visitor, I want to call the profile owner directly | P0 |
| US-022 | As a visitor, I want to email the profile owner with a templated subject | P0 |
| US-023 | As a visitor, I want to visit the profile owner's LinkedIn | P1 |
| US-024 | As a visitor, I want to download/view the profile owner's CV | P1 |

#### Epic: Privacy & Security
| ID | Story | Priority |
|----|-------|----------|
| US-030 | As a user, I want to set my profile as Public, Unlisted, or Password-protected | P0 |
| US-031 | As a user, I want to prevent search engines from indexing my profile | P1 |
| US-032 | As a user, I want to hide my phone number from public view (show only WhatsApp button) | P1 |
| US-033 | As a user, I want my profile URL slug to be unique and not contain profanity | P0 |

#### Epic: Analytics
| ID | Story | Priority |
|----|-------|----------|
| US-040 | As a user, I want to see how many people viewed my profile (7/30 days) | P0 |
| US-041 | As a user, I want to see which CTAs were clicked the most | P0 |
| US-042 | As a user, I want to know where my visitors came from (UTM source) | P2 |

#### Epic: Sharing
| ID | Story | Priority |
|----|-------|----------|
| US-050 | As a user, I want to copy my profile link with one click | P0 |
| US-051 | As a user, I want to download a QR code for my profile | P0 |

### 2.2 Edge Cases & Acceptance Criteria

#### Slug Validation
- **Reserved slugs**: `admin`, `api`, `login`, `register`, `dashboard`, `settings`, `help`, `support`, `about`, `privacy`, `terms`, `blog`, `pricing`, `contact`, `null`, `undefined`, `favicon`, `robots`, `sitemap`, `manifest`, `sw`, `service-worker`
- **Format**: 3-50 characters, alphanumeric + hyphens only, no consecutive hyphens, cannot start/end with hyphen
- **Profanity filter**: Block common offensive words (use configurable blocklist)
- **Case sensitivity**: Slugs are case-insensitive (stored lowercase)

#### Password Protection
- Access code: 4-8 alphanumeric characters
- Session-based access (valid for 24 hours via cookie)
- Rate limit: 5 attempts per 15 minutes per IP

#### Analytics Privacy
- No full IP storage (hash with daily-rotating salt)
- No PII in events
- User agent parsed for device type only
- Data retention: 90 days for detailed events, aggregated forever

#### PDF Handling
- Maximum file size: 10MB
- Signed URLs expire in 1 hour for unlisted/protected profiles
- Public profiles: Direct CDN link

### 2.3 Feature Flags & Plan Restrictions

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Seera Link profiles | 1 | 5 | Unlimited |
| Custom slug | ✓ | ✓ | ✓ |
| Templates | Minimal only | All | All + Custom |
| Analytics | 7 days | 30 days | 90 days |
| Password protection | ✗ | ✓ | ✓ |
| Download CV | ✗ | ✓ | ✓ |
| Custom CTA message | ✗ | ✓ | ✓ |
| Remove Seera branding | ✗ | ✗ | ✓ |

---

## 3. Data Model

### 3.1 Prisma Schema

```prisma
// Add to prisma/schema.prisma

// ==========================================
// SEERA LINK MODELS
// ==========================================

enum ProfileVisibility {
  PUBLIC
  UNLISTED
  PASSWORD_PROTECTED
}

enum ProfilePersona {
  JOBS
  FREELANCE
  NETWORKING
  CUSTOM
}

enum ProfileTemplate {
  MINIMAL
  BOLD
}

enum ProfileStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CTAType {
  WHATSAPP
  PHONE
  EMAIL
  LINKEDIN
  DOWNLOAD_CV
  VIEW_CV
  CUSTOM
}

enum AnalyticsEventType {
  PAGE_VIEW
  CTA_CLICK
  PDF_DOWNLOAD
}

model SeeraProfile {
  id                String              @id @default(cuid())
  userId            String
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  // URL & Identity
  slug              String              @unique
  persona           ProfilePersona      @default(JOBS)
  template          ProfileTemplate     @default(MINIMAL)
  status            ProfileStatus       @default(DRAFT)

  // Privacy
  visibility        ProfileVisibility   @default(PUBLIC)
  accessCode        String?             // Hashed password for protected profiles
  noIndex           Boolean             @default(false)
  hidePhoneNumber   Boolean             @default(false)

  // Hero Section
  displayName       String
  title             String
  location          String?
  bio               String?             @db.Text
  avatarUrl         String?

  // Status Badges (JSON array of strings like "Open to work", "Freelance")
  statusBadges      String[]            @default([])

  // Language & Theme
  language          String              @default("en") // "en" | "ar"
  themeColor        String              @default("sapphire") // Matches resume themes
  customColors      Json?               // Optional custom color overrides

  // Resume Integration
  sourceResumeId    String?             // Resume used to generate this profile
  sourceResume      Resume?             @relation(fields: [sourceResumeId], references: [id], onDelete: SetNull)

  // CV Settings
  enableDownloadCv  Boolean             @default(false)
  cvFileUrl         String?             // Uploaded PDF URL
  cvResumeId        String?             // Or link to existing resume for PDF generation

  // CTA Customization
  ctaWhatsappNumber String?
  ctaWhatsappMessage String?            @default("Hi! I saw your Seera profile and would like to connect.")
  ctaPhoneNumber    String?
  ctaEmail          String?
  ctaEmailSubject   String?             @default("Let's Connect")
  ctaEmailBody      String?             @db.Text
  ctaLinkedinUrl    String?
  enabledCtas       CTAType[]           @default([WHATSAPP, EMAIL, LINKEDIN])

  // Metadata
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  publishedAt       DateTime?
  deletedAt         DateTime?

  // Relations
  highlights        SeeraProfileHighlight[]
  experiences       SeeraProfileExperience[]
  projects          SeeraProfileProject[]
  certificates      SeeraProfileCertificate[]
  analytics         SeeraProfileAnalytics[]

  @@index([userId])
  @@index([slug])
  @@index([status])
  @@index([visibility])
  @@map("seera_profiles")
}

model SeeraProfileHighlight {
  id            String        @id @default(cuid())
  profileId     String
  profile       SeeraProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  content       String        @db.Text // The highlight text with metrics
  icon          String?       // Optional icon identifier (e.g., "trophy", "chart", "users")
  sortOrder     Int           @default(0)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([profileId])
  @@map("seera_profile_highlights")
}

model SeeraProfileExperience {
  id            String        @id @default(cuid())
  profileId     String
  profile       SeeraProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  company       String
  role          String
  location      String?
  startDate     String?       // "Jan 2020" format
  endDate       String?       // "Present" or "Dec 2023"
  description   String?       @db.Text
  isFeatured    Boolean       @default(false)
  sortOrder     Int           @default(0)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([profileId])
  @@map("seera_profile_experiences")
}

model SeeraProfileProject {
  id            String        @id @default(cuid())
  profileId     String
  profile       SeeraProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  title         String
  description   String?       @db.Text
  url           String?
  imageUrl      String?
  tags          String[]      @default([])
  sortOrder     Int           @default(0)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([profileId])
  @@map("seera_profile_projects")
}

model SeeraProfileCertificate {
  id            String        @id @default(cuid())
  profileId     String
  profile       SeeraProfile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  name          String
  issuer        String
  date          String?       // "2023" or "Jan 2023"
  url           String?       // Credential URL
  sortOrder     Int           @default(0)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([profileId])
  @@map("seera_profile_certificates")
}

model SeeraProfileAnalytics {
  id            String              @id @default(cuid())
  profileId     String
  profile       SeeraProfile        @relation(fields: [profileId], references: [id], onDelete: Cascade)

  eventType     AnalyticsEventType
  ctaType       CTAType?            // If event is CTA_CLICK

  // Privacy-friendly tracking
  visitorHash   String              // Hashed IP + User Agent for unique visitor detection
  deviceType    String?             // "desktop" | "mobile" | "tablet"
  referrer      String?             @db.Text
  country       String?             // From IP geolocation (coarse)

  // UTM Tracking
  utmSource     String?
  utmMedium     String?
  utmCampaign   String?
  utmContent    String?
  utmTerm       String?

  createdAt     DateTime            @default(now())

  @@index([profileId])
  @@index([profileId, eventType])
  @@index([profileId, createdAt])
  @@index([createdAt])
  @@map("seera_profile_analytics")
}

// Slug reservation table for profanity filter and reserved words
model ReservedSlug {
  slug          String    @id
  reason        String    // "reserved" | "profanity" | "trademark"
  createdAt     DateTime  @default(now())

  @@map("reserved_slugs")
}
```

### 3.2 SQL Migration

```sql
-- Migration: Create Seera Link Tables
-- File: prisma/migrations/YYYYMMDDHHMMSS_add_seera_link/migration.sql

-- Create enums
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PASSWORD_PROTECTED');
CREATE TYPE "ProfilePersona" AS ENUM ('JOBS', 'FREELANCE', 'NETWORKING', 'CUSTOM');
CREATE TYPE "ProfileTemplate" AS ENUM ('MINIMAL', 'BOLD');
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "CTAType" AS ENUM ('WHATSAPP', 'PHONE', 'EMAIL', 'LINKEDIN', 'DOWNLOAD_CV', 'VIEW_CV', 'CUSTOM');
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'CTA_CLICK', 'PDF_DOWNLOAD');

-- Create main profiles table
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

-- Create highlights table
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

-- Create experiences table
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

-- Create projects table
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

-- Create certificates table
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

-- Create analytics table
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

-- Create reserved slugs table
CREATE TABLE "reserved_slugs" (
    "slug" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserved_slugs_pkey" PRIMARY KEY ("slug")
);

-- Create indexes
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

-- Add foreign keys
ALTER TABLE "seera_profiles" ADD CONSTRAINT "seera_profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seera_profiles" ADD CONSTRAINT "seera_profiles_sourceResumeId_fkey"
    FOREIGN KEY ("sourceResumeId") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "seera_profile_highlights" ADD CONSTRAINT "seera_profile_highlights_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seera_profile_experiences" ADD CONSTRAINT "seera_profile_experiences_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seera_profile_projects" ADD CONSTRAINT "seera_profile_projects_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seera_profile_certificates" ADD CONSTRAINT "seera_profile_certificates_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seera_profile_analytics" ADD CONSTRAINT "seera_profile_analytics_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "seera_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed reserved slugs
INSERT INTO "reserved_slugs" ("slug", "reason") VALUES
    ('admin', 'reserved'),
    ('api', 'reserved'),
    ('login', 'reserved'),
    ('register', 'reserved'),
    ('signup', 'reserved'),
    ('signin', 'reserved'),
    ('dashboard', 'reserved'),
    ('settings', 'reserved'),
    ('help', 'reserved'),
    ('support', 'reserved'),
    ('about', 'reserved'),
    ('privacy', 'reserved'),
    ('terms', 'reserved'),
    ('blog', 'reserved'),
    ('pricing', 'reserved'),
    ('contact', 'reserved'),
    ('null', 'reserved'),
    ('undefined', 'reserved'),
    ('favicon', 'reserved'),
    ('robots', 'reserved'),
    ('sitemap', 'reserved'),
    ('manifest', 'reserved'),
    ('sw', 'reserved'),
    ('service-worker', 'reserved'),
    ('p', 'reserved'),
    ('u', 'reserved'),
    ('profile', 'reserved'),
    ('profiles', 'reserved'),
    ('seera', 'trademark'),
    ('seera-ai', 'trademark'),
    ('seeraai', 'trademark');
```

### 3.3 Update User Model Relation

Add this to the existing User model in `schema.prisma`:

```prisma
model User {
  // ... existing fields ...

  seeraProfiles    SeeraProfile[]
}
```

---

## 4. API Layer

### 4.1 Zod Validation Schemas

```typescript
// src/lib/seera-link/schemas.ts

import { z } from 'zod';

// Slug validation
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(slugRegex, 'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens)')
  .transform((s) => s.toLowerCase());

// Profile visibility
export const visibilitySchema = z.enum(['PUBLIC', 'UNLISTED', 'PASSWORD_PROTECTED']);

// Profile persona
export const personaSchema = z.enum(['JOBS', 'FREELANCE', 'NETWORKING', 'CUSTOM']);

// Profile template
export const templateSchema = z.enum(['MINIMAL', 'BOLD']);

// Profile status
export const statusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

// CTA types
export const ctaTypeSchema = z.enum([
  'WHATSAPP',
  'PHONE',
  'EMAIL',
  'LINKEDIN',
  'DOWNLOAD_CV',
  'VIEW_CV',
  'CUSTOM',
]);

// Theme colors (matching resume themes)
export const themeColorSchema = z.enum([
  'obsidian',
  'sapphire',
  'emerald',
  'ruby',
  'amber',
  'slate',
]);

// Highlight schema
export const highlightSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1).max(500),
  icon: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

// Experience schema
export const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  location: z.string().max(100).optional().nullable(),
  startDate: z.string().max(20).optional().nullable(),
  endDate: z.string().max(20).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

// Project schema
export const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  url: z.string().url().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  sortOrder: z.number().int().min(0).default(0),
});

// Certificate schema
export const certificateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  issuer: z.string().min(1).max(100),
  date: z.string().max(20).optional().nullable(),
  url: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

// Main profile create/update schema
export const createProfileSchema = z.object({
  slug: slugSchema,
  persona: personaSchema.default('JOBS'),
  template: templateSchema.default('MINIMAL'),
  visibility: visibilitySchema.default('PUBLIC'),
  accessCode: z.string().min(4).max(8).optional().nullable(),
  noIndex: z.boolean().default(false),
  hidePhoneNumber: z.boolean().default(false),

  // Hero
  displayName: z.string().min(1).max(100),
  title: z.string().min(1).max(150),
  location: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),

  // Status badges
  statusBadges: z.array(z.string().max(30)).max(5).default([]),

  // Language & Theme
  language: z.enum(['en', 'ar']).default('en'),
  themeColor: themeColorSchema.default('sapphire'),

  // Resume integration
  sourceResumeId: z.string().optional().nullable(),

  // CV settings
  enableDownloadCv: z.boolean().default(false),
  cvFileUrl: z.string().url().optional().nullable(),
  cvResumeId: z.string().optional().nullable(),

  // CTAs
  ctaWhatsappNumber: z.string().max(20).optional().nullable(),
  ctaWhatsappMessage: z.string().max(200).optional().nullable(),
  ctaPhoneNumber: z.string().max(20).optional().nullable(),
  ctaEmail: z.string().email().optional().nullable(),
  ctaEmailSubject: z.string().max(100).optional().nullable(),
  ctaEmailBody: z.string().max(500).optional().nullable(),
  ctaLinkedinUrl: z.string().url().optional().nullable(),
  enabledCtas: z.array(ctaTypeSchema).default(['WHATSAPP', 'EMAIL', 'LINKEDIN']),

  // Nested content
  highlights: z.array(highlightSchema).max(8).default([]),
  experiences: z.array(experienceSchema).max(10).default([]),
  projects: z.array(projectSchema).max(10).default([]),
  certificates: z.array(certificateSchema).max(10).default([]),
});

export const updateProfileSchema = createProfileSchema.partial().extend({
  id: z.string(),
});

// Publish profile schema
export const publishProfileSchema = z.object({
  id: z.string(),
});

// Password verification schema
export const verifyPasswordSchema = z.object({
  slug: z.string(),
  accessCode: z.string().min(4).max(8),
});

// Analytics event schema
export const analyticsEventSchema = z.object({
  profileId: z.string(),
  eventType: z.enum(['PAGE_VIEW', 'CTA_CLICK', 'PDF_DOWNLOAD']),
  ctaType: ctaTypeSchema.optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  referrer: z.string().max(500).optional(),
});

// Type exports
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
```

### 4.2 API Route Handlers

#### Profile CRUD Routes

```typescript
// src/app/api/seera-link/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { errors, handleZodError, success } from '@/lib/api-response';
import { createProfileSchema } from '@/lib/seera-link/schemas';
import { validateSlug, hashAccessCode } from '@/lib/seera-link/utils';
import { getProfileLimits } from '@/lib/seera-link/limits';

// GET /api/seera-link - List user's profiles
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const profiles = await prisma.seeraProfile.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            analytics: {
              where: {
                eventType: 'PAGE_VIEW',
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return success(profiles);
  } catch (error) {
    console.error('Error fetching Seera profiles:', error);
    return errors.internal('Failed to fetch profiles');
  }
}

// POST /api/seera-link - Create new profile
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const body = await request.json();
    const data = createProfileSchema.parse(body);

    // Check plan limits
    const limits = await getProfileLimits(session.user.id);
    if (limits.current >= limits.max) {
      return errors.forbidden(
        `You've reached your profile limit (${limits.max}). Upgrade to create more.`
      );
    }

    // Validate slug
    const slugValidation = await validateSlug(data.slug);
    if (!slugValidation.valid) {
      return errors.validation(slugValidation.error || 'Invalid slug');
    }

    // Hash access code if provided
    let hashedAccessCode = null;
    if (data.accessCode && data.visibility === 'PASSWORD_PROTECTED') {
      hashedAccessCode = await hashAccessCode(data.accessCode);
    }

    // Create profile with nested data
    const profile = await prisma.seeraProfile.create({
      data: {
        userId: session.user.id,
        slug: data.slug,
        persona: data.persona,
        template: data.template,
        visibility: data.visibility,
        accessCode: hashedAccessCode,
        noIndex: data.noIndex,
        hidePhoneNumber: data.hidePhoneNumber,
        displayName: data.displayName,
        title: data.title,
        location: data.location,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        statusBadges: data.statusBadges,
        language: data.language,
        themeColor: data.themeColor,
        sourceResumeId: data.sourceResumeId,
        enableDownloadCv: data.enableDownloadCv,
        cvFileUrl: data.cvFileUrl,
        cvResumeId: data.cvResumeId,
        ctaWhatsappNumber: data.ctaWhatsappNumber,
        ctaWhatsappMessage: data.ctaWhatsappMessage,
        ctaPhoneNumber: data.ctaPhoneNumber,
        ctaEmail: data.ctaEmail,
        ctaEmailSubject: data.ctaEmailSubject,
        ctaEmailBody: data.ctaEmailBody,
        ctaLinkedinUrl: data.ctaLinkedinUrl,
        enabledCtas: data.enabledCtas,
        highlights: {
          create: data.highlights.map((h, i) => ({
            content: h.content,
            icon: h.icon,
            sortOrder: h.sortOrder ?? i,
          })),
        },
        experiences: {
          create: data.experiences.map((e, i) => ({
            company: e.company,
            role: e.role,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            description: e.description,
            isFeatured: e.isFeatured,
            sortOrder: e.sortOrder ?? i,
          })),
        },
        projects: {
          create: data.projects.map((p, i) => ({
            title: p.title,
            description: p.description,
            url: p.url,
            imageUrl: p.imageUrl,
            tags: p.tags,
            sortOrder: p.sortOrder ?? i,
          })),
        },
        certificates: {
          create: data.certificates.map((c, i) => ({
            name: c.name,
            issuer: c.issuer,
            date: c.date,
            url: c.url,
            sortOrder: c.sortOrder ?? i,
          })),
        },
      },
      include: {
        highlights: true,
        experiences: true,
        projects: true,
        certificates: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'SeeraProfile',
        entityId: profile.id,
        metadata: { slug: data.slug },
      },
    });

    return success(profile, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    console.error('Error creating Seera profile:', error);
    return errors.internal('Failed to create profile');
  }
}
```

#### Single Profile Operations

```typescript
// src/app/api/seera-link/[id]/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { errors, handleZodError, success } from '@/lib/api-response';
import { updateProfileSchema } from '@/lib/seera-link/schemas';
import { validateSlug, hashAccessCode } from '@/lib/seera-link/utils';

interface RouteParams {
  params: { id: string };
}

// GET /api/seera-link/[id] - Get single profile
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        highlights: { orderBy: { sortOrder: 'asc' } },
        experiences: { orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
        certificates: { orderBy: { sortOrder: 'asc' } },
        sourceResume: {
          select: { id: true, title: true },
        },
      },
    });

    if (!profile) {
      return errors.notFound('Profile not found');
    }

    return success(profile);
  } catch (error) {
    console.error('Error fetching Seera profile:', error);
    return errors.internal('Failed to fetch profile');
  }
}

// PATCH /api/seera-link/[id] - Update profile
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    // Check ownership
    const existing = await prisma.seeraProfile.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return errors.notFound('Profile not found');
    }

    const body = await request.json();
    const data = updateProfileSchema.parse({ ...body, id: params.id });

    // Validate slug if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugValidation = await validateSlug(data.slug, params.id);
      if (!slugValidation.valid) {
        return errors.validation(slugValidation.error || 'Invalid slug');
      }
    }

    // Hash access code if changed
    let accessCodeUpdate = {};
    if (data.accessCode !== undefined) {
      if (data.accessCode && data.visibility === 'PASSWORD_PROTECTED') {
        accessCodeUpdate = { accessCode: await hashAccessCode(data.accessCode) };
      } else if (!data.accessCode) {
        accessCodeUpdate = { accessCode: null };
      }
    }

    // Update profile - transaction for nested data
    const profile = await prisma.$transaction(async (tx) => {
      // Delete existing nested records if provided
      if (data.highlights !== undefined) {
        await tx.seeraProfileHighlight.deleteMany({ where: { profileId: params.id } });
      }
      if (data.experiences !== undefined) {
        await tx.seeraProfileExperience.deleteMany({ where: { profileId: params.id } });
      }
      if (data.projects !== undefined) {
        await tx.seeraProfileProject.deleteMany({ where: { profileId: params.id } });
      }
      if (data.certificates !== undefined) {
        await tx.seeraProfileCertificate.deleteMany({ where: { profileId: params.id } });
      }

      // Update profile
      return tx.seeraProfile.update({
        where: { id: params.id },
        data: {
          ...(data.slug && { slug: data.slug }),
          ...(data.persona && { persona: data.persona }),
          ...(data.template && { template: data.template }),
          ...(data.visibility && { visibility: data.visibility }),
          ...accessCodeUpdate,
          ...(data.noIndex !== undefined && { noIndex: data.noIndex }),
          ...(data.hidePhoneNumber !== undefined && { hidePhoneNumber: data.hidePhoneNumber }),
          ...(data.displayName && { displayName: data.displayName }),
          ...(data.title && { title: data.title }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          ...(data.statusBadges && { statusBadges: data.statusBadges }),
          ...(data.language && { language: data.language }),
          ...(data.themeColor && { themeColor: data.themeColor }),
          ...(data.sourceResumeId !== undefined && { sourceResumeId: data.sourceResumeId }),
          ...(data.enableDownloadCv !== undefined && { enableDownloadCv: data.enableDownloadCv }),
          ...(data.cvFileUrl !== undefined && { cvFileUrl: data.cvFileUrl }),
          ...(data.cvResumeId !== undefined && { cvResumeId: data.cvResumeId }),
          ...(data.ctaWhatsappNumber !== undefined && { ctaWhatsappNumber: data.ctaWhatsappNumber }),
          ...(data.ctaWhatsappMessage !== undefined && { ctaWhatsappMessage: data.ctaWhatsappMessage }),
          ...(data.ctaPhoneNumber !== undefined && { ctaPhoneNumber: data.ctaPhoneNumber }),
          ...(data.ctaEmail !== undefined && { ctaEmail: data.ctaEmail }),
          ...(data.ctaEmailSubject !== undefined && { ctaEmailSubject: data.ctaEmailSubject }),
          ...(data.ctaEmailBody !== undefined && { ctaEmailBody: data.ctaEmailBody }),
          ...(data.ctaLinkedinUrl !== undefined && { ctaLinkedinUrl: data.ctaLinkedinUrl }),
          ...(data.enabledCtas && { enabledCtas: data.enabledCtas }),
          // Recreate nested records
          ...(data.highlights && {
            highlights: {
              create: data.highlights.map((h, i) => ({
                content: h.content,
                icon: h.icon,
                sortOrder: h.sortOrder ?? i,
              })),
            },
          }),
          ...(data.experiences && {
            experiences: {
              create: data.experiences.map((e, i) => ({
                company: e.company,
                role: e.role,
                location: e.location,
                startDate: e.startDate,
                endDate: e.endDate,
                description: e.description,
                isFeatured: e.isFeatured,
                sortOrder: e.sortOrder ?? i,
              })),
            },
          }),
          ...(data.projects && {
            projects: {
              create: data.projects.map((p, i) => ({
                title: p.title,
                description: p.description,
                url: p.url,
                imageUrl: p.imageUrl,
                tags: p.tags,
                sortOrder: p.sortOrder ?? i,
              })),
            },
          }),
          ...(data.certificates && {
            certificates: {
              create: data.certificates.map((c, i) => ({
                name: c.name,
                issuer: c.issuer,
                date: c.date,
                url: c.url,
                sortOrder: c.sortOrder ?? i,
              })),
            },
          }),
        },
        include: {
          highlights: { orderBy: { sortOrder: 'asc' } },
          experiences: { orderBy: { sortOrder: 'asc' } },
          projects: { orderBy: { sortOrder: 'asc' } },
          certificates: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return success(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    console.error('Error updating Seera profile:', error);
    return errors.internal('Failed to update profile');
  }
}

// DELETE /api/seera-link/[id] - Soft delete profile
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!profile) {
      return errors.notFound('Profile not found');
    }

    await prisma.seeraProfile.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entity: 'SeeraProfile',
        entityId: params.id,
      },
    });

    return success({ deleted: true });
  } catch (error) {
    console.error('Error deleting Seera profile:', error);
    return errors.internal('Failed to delete profile');
  }
}
```

#### Publish/Unpublish Routes

```typescript
// src/app/api/seera-link/[id]/publish/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { errors, success } from '@/lib/api-response';

interface RouteParams {
  params: { id: string };
}

// POST /api/seera-link/[id]/publish
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!profile) {
      return errors.notFound('Profile not found');
    }

    // Validate profile has minimum required data
    if (!profile.displayName || !profile.title) {
      return errors.validation('Profile must have a name and title to publish');
    }

    await prisma.seeraProfile.update({
      where: { id: params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: profile.publishedAt || new Date(),
      },
    });

    return success({ published: true, slug: profile.slug });
  } catch (error) {
    console.error('Error publishing profile:', error);
    return errors.internal('Failed to publish profile');
  }
}

// DELETE /api/seera-link/[id]/publish - Unpublish
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!profile) {
      return errors.notFound('Profile not found');
    }

    await prisma.seeraProfile.update({
      where: { id: params.id },
      data: { status: 'DRAFT' },
    });

    return success({ unpublished: true });
  } catch (error) {
    console.error('Error unpublishing profile:', error);
    return errors.internal('Failed to unpublish profile');
  }
}
```

#### Analytics Routes

```typescript
// src/app/api/seera-link/analytics/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { errors, handleZodError, success } from '@/lib/api-response';
import { analyticsEventSchema } from '@/lib/seera-link/schemas';
import { hashVisitor, getDeviceType, getCountryFromIP } from '@/lib/seera-link/analytics';
import { checkRateLimit } from '@/lib/seera-link/rate-limit';

// POST /api/seera-link/analytics - Log event (public endpoint)
export async function POST(request: Request) {
  try {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const userAgent = headersList.get('user-agent') || '';

    // Rate limit: 100 events per minute per IP
    const rateLimitKey = `seera-link-analytics:${ip}`;
    const isAllowed = await checkRateLimit(rateLimitKey, 100, 60);
    if (!isAllowed) {
      return errors.rateLimited('Too many requests');
    }

    const body = await request.json();
    const data = analyticsEventSchema.parse(body);

    // Verify profile exists and is accessible
    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id: data.profileId,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: { id: true, visibility: true },
    });

    if (!profile) {
      return errors.notFound('Profile not found');
    }

    // Create analytics event
    await prisma.seeraProfileAnalytics.create({
      data: {
        profileId: data.profileId,
        eventType: data.eventType,
        ctaType: data.ctaType,
        visitorHash: await hashVisitor(ip, userAgent),
        deviceType: getDeviceType(userAgent),
        referrer: data.referrer,
        country: await getCountryFromIP(ip),
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmContent: data.utmContent,
        utmTerm: data.utmTerm,
      },
    });

    return success({ logged: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    console.error('Error logging analytics:', error);
    // Don't expose errors for analytics - just return success
    return success({ logged: true });
  }
}
```

```typescript
// src/app/api/seera-link/[id]/analytics/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { errors, success } from '@/lib/api-response';

interface RouteParams {
  params: { id: string };
}

// GET /api/seera-link/[id]/analytics - Get analytics for profile
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const validDays = [7, 30, 90].includes(days) ? days : 7;

    // Verify ownership
    const profile = await prisma.seeraProfile.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    if (!profile) {
      return errors.notFound('Profile not found');
    }

    const since = new Date(Date.now() - validDays * 24 * 60 * 60 * 1000);

    // Get aggregated analytics
    const [views, uniqueViews, ctaClicks, topSources, dailyViews] = await Promise.all([
      // Total views
      prisma.seeraProfileAnalytics.count({
        where: {
          profileId: params.id,
          eventType: 'PAGE_VIEW',
          createdAt: { gte: since },
        },
      }),
      // Unique views
      prisma.seeraProfileAnalytics.groupBy({
        by: ['visitorHash'],
        where: {
          profileId: params.id,
          eventType: 'PAGE_VIEW',
          createdAt: { gte: since },
        },
      }).then((r) => r.length),
      // CTA clicks by type
      prisma.seeraProfileAnalytics.groupBy({
        by: ['ctaType'],
        where: {
          profileId: params.id,
          eventType: 'CTA_CLICK',
          createdAt: { gte: since },
        },
        _count: true,
      }),
      // Top UTM sources
      prisma.seeraProfileAnalytics.groupBy({
        by: ['utmSource'],
        where: {
          profileId: params.id,
          eventType: 'PAGE_VIEW',
          createdAt: { gte: since },
          utmSource: { not: null },
        },
        _count: true,
        orderBy: { _count: { utmSource: 'desc' } },
        take: 5,
      }),
      // Daily views (for chart)
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as views,
          COUNT(DISTINCT visitor_hash) as unique_views
        FROM seera_profile_analytics
        WHERE profile_id = ${params.id}
          AND event_type = 'PAGE_VIEW'
          AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    return success({
      period: validDays,
      totalViews: views,
      uniqueViews,
      ctaClicks: ctaClicks.map((c) => ({
        type: c.ctaType,
        clicks: c._count,
      })),
      topSources: topSources.map((s) => ({
        source: s.utmSource,
        views: s._count,
      })),
      dailyViews,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return errors.internal('Failed to fetch analytics');
  }
}
```

#### Password Verification

```typescript
// src/app/api/seera-link/verify-password/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { errors, handleZodError, success } from '@/lib/api-response';
import { verifyPasswordSchema } from '@/lib/seera-link/schemas';
import { verifyAccessCode } from '@/lib/seera-link/utils';
import { checkRateLimit } from '@/lib/seera-link/rate-limit';

// POST /api/seera-link/verify-password
export async function POST(request: Request) {
  try {
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Rate limit: 5 attempts per 15 minutes per IP
    const rateLimitKey = `seera-link-password:${ip}`;
    const isAllowed = await checkRateLimit(rateLimitKey, 5, 900);
    if (!isAllowed) {
      return errors.rateLimited('Too many attempts. Please try again in 15 minutes.');
    }

    const body = await request.json();
    const data = verifyPasswordSchema.parse(body);

    const profile = await prisma.seeraProfile.findFirst({
      where: {
        slug: data.slug.toLowerCase(),
        status: 'PUBLISHED',
        visibility: 'PASSWORD_PROTECTED',
        deletedAt: null,
      },
      select: { id: true, accessCode: true },
    });

    if (!profile || !profile.accessCode) {
      return errors.notFound('Profile not found');
    }

    const isValid = await verifyAccessCode(data.accessCode, profile.accessCode);
    if (!isValid) {
      return errors.unauthorized('Invalid access code');
    }

    // Set access cookie (24 hours)
    const cookieStore = cookies();
    cookieStore.set(`seera-link-access-${data.slug}`, profile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: `/p/${data.slug}`,
    });

    return success({ verified: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    console.error('Error verifying password:', error);
    return errors.internal('Failed to verify password');
  }
}
```

#### Slug Validation

```typescript
// src/app/api/seera-link/check-slug/route.ts

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { errors, handleZodError, success } from '@/lib/api-response';
import { slugSchema } from '@/lib/seera-link/schemas';
import { validateSlug } from '@/lib/seera-link/utils';

// GET /api/seera-link/check-slug?slug=xxx
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return errors.validation('Slug is required');
    }

    try {
      slugSchema.parse(slug);
    } catch {
      return success({ available: false, reason: 'Invalid format' });
    }

    const validation = await validateSlug(slug);
    return success({
      available: validation.valid,
      reason: validation.error,
    });
  } catch (error) {
    console.error('Error checking slug:', error);
    return errors.internal('Failed to check slug');
  }
}
```

### 4.3 Utility Functions

```typescript
// src/lib/seera-link/utils.ts

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { profanityList } from './profanity';

/**
 * Validate slug availability and format
 */
export async function validateSlug(
  slug: string,
  excludeProfileId?: string
): Promise<{ valid: boolean; error?: string }> {
  const normalizedSlug = slug.toLowerCase();

  // Check reserved slugs
  const reserved = await prisma.reservedSlug.findUnique({
    where: { slug: normalizedSlug },
  });

  if (reserved) {
    return {
      valid: false,
      error:
        reserved.reason === 'profanity'
          ? 'This slug contains inappropriate content'
          : 'This slug is reserved',
    };
  }

  // Check profanity (in-memory check for common words)
  if (profanityList.some((word) => normalizedSlug.includes(word))) {
    return { valid: false, error: 'This slug contains inappropriate content' };
  }

  // Check existing profiles
  const existing = await prisma.seeraProfile.findFirst({
    where: {
      slug: normalizedSlug,
      ...(excludeProfileId && { id: { not: excludeProfileId } }),
      deletedAt: null,
    },
  });

  if (existing) {
    return { valid: false, error: 'This slug is already taken' };
  }

  return { valid: true };
}

/**
 * Hash access code for password-protected profiles
 */
export async function hashAccessCode(code: string): Promise<string> {
  return bcrypt.hash(code, 12);
}

/**
 * Verify access code
 */
export async function verifyAccessCode(
  code: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Generate slug suggestions from name
 */
export function generateSlugSuggestions(name: string): string[] {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);

  const suggestions = [
    base,
    `${base}-pro`,
    `${base}-${Math.floor(Math.random() * 1000)}`,
  ];

  return suggestions.filter((s) => s.length >= 3);
}
```

```typescript
// src/lib/seera-link/analytics.ts

import crypto from 'crypto';

// Daily rotating salt for privacy
function getDailySalt(): string {
  const date = new Date().toISOString().split('T')[0];
  return `seera-link-${date}-${process.env.NEXTAUTH_SECRET?.slice(0, 10)}`;
}

/**
 * Hash visitor for unique visitor tracking
 * Uses IP + User-Agent with daily rotating salt
 */
export async function hashVisitor(ip: string, userAgent: string): Promise<string> {
  const salt = getDailySalt();
  const data = `${ip}-${userAgent}-${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

/**
 * Get device type from user agent
 */
export function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get country from IP (coarse geolocation)
 * In production, use a service like MaxMind GeoLite2 or IP-API
 */
export async function getCountryFromIP(ip: string): Promise<string | null> {
  // Skip for local IPs
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
    return null;
  }

  try {
    // Free IP geolocation (rate limited - use cached/paid service in production)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(1000), // 1s timeout
    });
    if (response.ok) {
      const data = await response.json();
      return data.countryCode || null;
    }
  } catch {
    // Silently fail - geolocation is optional
  }
  return null;
}
```

```typescript
// src/lib/seera-link/rate-limit.ts

import { prisma } from '@/lib/db';

/**
 * Simple database-based rate limiting
 * For production, consider using Redis for better performance
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);

  // Clean old records
  await prisma.rateLimitRecord.deleteMany({
    where: {
      key,
      createdAt: { lt: windowStart },
    },
  });

  // Count recent requests
  const count = await prisma.rateLimitRecord.count({
    where: {
      key,
      createdAt: { gte: windowStart },
    },
  });

  if (count >= limit) {
    return false;
  }

  // Record this request
  await prisma.rateLimitRecord.create({
    data: { key },
  });

  return true;
}
```

```typescript
// src/lib/seera-link/limits.ts

import { prisma } from '@/lib/db';

interface ProfileLimits {
  current: number;
  max: number;
  plan: string;
}

/**
 * Get profile limits based on user's subscription
 */
export async function getProfileLimits(userId: string): Promise<ProfileLimits> {
  const [subscription, profileCount] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: { plan: true },
    }),
    prisma.seeraProfile.count({
      where: { userId, deletedAt: null },
    }),
  ]);

  const plan = subscription?.plan || 'FREE';
  const limits: Record<string, number> = {
    FREE: 1,
    PRO: 5,
    ENTERPRISE: 100,
  };

  return {
    current: profileCount,
    max: limits[plan] || 1,
    plan,
  };
}
```

```typescript
// src/lib/seera-link/profanity.ts

// Basic profanity list - extend as needed
export const profanityList = [
  'fuck',
  'shit',
  'ass',
  'bitch',
  'damn',
  'crap',
  'piss',
  'dick',
  'cock',
  'pussy',
  'bastard',
  'slut',
  'whore',
  // Add more as needed
];
```

---

## 5. Frontend Architecture

### 5.1 Dashboard Pages Structure

```
src/app/(dashboard)/dashboard/seera-link/
├── page.tsx                    # Profile list page
├── new/
│   └── page.tsx               # Create new profile
├── [id]/
│   ├── page.tsx               # Edit profile
│   └── analytics/
│       └── page.tsx           # Analytics dashboard
└── loading.tsx                # Loading state
```

### 5.2 Public Profile Page

```
src/app/p/[slug]/
├── page.tsx                   # Public profile (SSR)
├── layout.tsx                 # Minimal layout (no dashboard chrome)
├── password/
│   └── page.tsx              # Password entry form
└── opengraph-image.tsx       # Dynamic OG image
```

### 5.3 Components

```
src/components/seera-link/
├── profile-list.tsx           # List of user's profiles
├── profile-card.tsx           # Profile card in list
├── profile-editor.tsx         # Main editor component
├── profile-preview.tsx        # Live preview
├── profile-form/
│   ├── hero-section.tsx       # Name, title, bio form
│   ├── highlights-section.tsx # Achievements editor
│   ├── experience-section.tsx # Experience editor
│   ├── projects-section.tsx   # Projects editor
│   ├── certificates-section.tsx # Certificates editor
│   ├── cta-section.tsx        # CTA buttons config
│   ├── settings-section.tsx   # Privacy, template, etc.
│   └── resume-picker.tsx      # Select source resume
├── templates/
│   ├── minimal.tsx            # Minimal template
│   └── bold.tsx               # Bold template
├── public-profile/
│   ├── profile-hero.tsx       # Public hero section
│   ├── profile-highlights.tsx # Public highlights
│   ├── profile-experience.tsx # Public experience
│   ├── profile-projects.tsx   # Public projects
│   ├── profile-certificates.tsx # Public certificates
│   ├── profile-cta.tsx        # CTA buttons
│   └── analytics-beacon.tsx   # Client-side tracking
├── analytics/
│   ├── analytics-card.tsx     # Summary card
│   ├── views-chart.tsx        # Daily views chart
│   └── cta-breakdown.tsx      # CTA clicks breakdown
├── share/
│   ├── copy-link-button.tsx   # Copy to clipboard
│   └── qr-code-dialog.tsx     # QR code generator
└── password-form.tsx          # Password entry component
```

### 5.4 Key Component Implementations

See the following files (to be created):
- `src/components/seera-link/profile-editor.tsx` - Full editor with live preview
- `src/components/seera-link/templates/minimal.tsx` - Minimal template
- `src/components/seera-link/templates/bold.tsx` - Bold template
- `src/app/p/[slug]/page.tsx` - Public profile page with SSR

---

## 6. Security Checklist

### 6.1 Authentication & Authorization
- [x] All dashboard routes require authentication via `auth()`
- [x] Profile CRUD operations verify user ownership
- [x] Analytics API validates profile exists and is published
- [x] Password verification uses bcrypt with cost factor 12

### 6.2 Input Validation
- [x] All inputs validated with Zod schemas
- [x] Slug format restricted to safe characters
- [x] Maximum lengths enforced on all text fields
- [x] URL fields validated for proper format

### 6.3 Rate Limiting
- [x] Analytics endpoint: 100 requests/minute per IP
- [x] Password verification: 5 attempts/15 minutes per IP
- [x] Profile creation: 10/hour per user (via plan limits)

### 6.4 Privacy
- [x] No full IP storage (daily-rotating hash)
- [x] Access code stored as bcrypt hash
- [x] noindex meta tag when requested
- [x] Unlisted profiles not indexed

### 6.5 Content Security
- [x] Reserved slugs list prevents impersonation
- [x] Profanity filter on slugs
- [x] Soft delete prevents slug recycling attacks
- [x] XSS prevention via React's default escaping

### 6.6 PDF Security
- [x] Signed URLs for protected profiles (1-hour expiry)
- [x] File size limit (10MB)
- [x] Supabase storage policies

### 6.7 Caching & Performance
- [x] Public profiles cached with ISR (revalidate: 60s)
- [x] Analytics beacon is fire-and-forget (non-blocking)
- [x] Database queries use appropriate indexes

---

## 7. Implementation Plan

### Phase 1: Foundation (Days 1-2)
1. [ ] Add Prisma schema models
2. [ ] Run database migration
3. [ ] Create validation schemas (`src/lib/seera-link/schemas.ts`)
4. [ ] Create utility functions (`src/lib/seera-link/utils.ts`, `analytics.ts`, etc.)
5. [ ] Add i18n translations for Seera Link

### Phase 2: API Layer (Days 3-4)
6. [ ] Implement CRUD routes (`/api/seera-link/*`)
7. [ ] Implement publish/unpublish routes
8. [ ] Implement analytics event route
9. [ ] Implement password verification route
10. [ ] Implement slug validation route
11. [ ] Add rate limiting middleware

### Phase 3: Dashboard UI (Days 5-7)
12. [ ] Create profile list page
13. [ ] Create profile editor with form sections
14. [ ] Implement live preview component
15. [ ] Create resume picker (auto-fill from resume)
16. [ ] Add template selector
17. [ ] Add QR code and copy link functionality

### Phase 4: Public Profile (Days 8-9)
18. [ ] Create public profile route (`/p/[slug]`)
19. [ ] Implement Minimal template
20. [ ] Implement Bold template
21. [ ] Add RTL support for Arabic
22. [ ] Implement password protection flow
23. [ ] Add analytics beacon
24. [ ] Configure caching (ISR)

### Phase 5: Analytics Dashboard (Day 10)
25. [ ] Create analytics summary card
26. [ ] Implement views chart
27. [ ] Implement CTA breakdown
28. [ ] Add UTM source tracking display

### Phase 6: Polish & Testing (Days 11-12)
29. [ ] Add navigation item in dashboard sidebar
30. [ ] Mobile responsiveness testing
31. [ ] RTL layout testing
32. [ ] Write unit tests for validation
33. [ ] Write integration tests for analytics
34. [ ] Write e2e tests for main flows

### Phase 7: Documentation & Launch (Day 13)
35. [ ] Update user documentation
36. [ ] Add onboarding tooltip/guide
37. [ ] Final QA pass
38. [ ] Deploy to production

---

## 8. Testing Plan

### 8.1 Unit Tests

```typescript
// __tests__/seera-link/schemas.test.ts

import { describe, it, expect } from 'vitest';
import { slugSchema, createProfileSchema } from '@/lib/seera-link/schemas';

describe('slugSchema', () => {
  it('accepts valid slugs', () => {
    expect(slugSchema.parse('john-doe')).toBe('john-doe');
    expect(slugSchema.parse('jane123')).toBe('jane123');
  });

  it('rejects invalid slugs', () => {
    expect(() => slugSchema.parse('ab')).toThrow(); // Too short
    expect(() => slugSchema.parse('John-Doe')).not.toThrow(); // Transforms to lowercase
    expect(() => slugSchema.parse('john--doe')).toThrow(); // Consecutive hyphens
    expect(() => slugSchema.parse('-john')).toThrow(); // Starts with hyphen
  });
});

describe('createProfileSchema', () => {
  it('validates complete profile data', () => {
    const validProfile = {
      slug: 'john-doe',
      displayName: 'John Doe',
      title: 'Software Engineer',
      highlights: [{ content: 'Led team of 10' }],
    };
    expect(() => createProfileSchema.parse(validProfile)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => createProfileSchema.parse({})).toThrow();
  });
});
```

### 8.2 Integration Tests

```typescript
// __tests__/seera-link/analytics.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/db';
import { hashVisitor, getDeviceType } from '@/lib/seera-link/analytics';

describe('Analytics', () => {
  describe('hashVisitor', () => {
    it('generates consistent hashes for same input on same day', async () => {
      const hash1 = await hashVisitor('1.2.3.4', 'Mozilla/5.0');
      const hash2 = await hashVisitor('1.2.3.4', 'Mozilla/5.0');
      expect(hash1).toBe(hash2);
    });

    it('generates different hashes for different IPs', async () => {
      const hash1 = await hashVisitor('1.2.3.4', 'Mozilla/5.0');
      const hash2 = await hashVisitor('5.6.7.8', 'Mozilla/5.0');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getDeviceType', () => {
    it('detects mobile devices', () => {
      expect(getDeviceType('Mozilla/5.0 (iPhone)')).toBe('mobile');
      expect(getDeviceType('Mozilla/5.0 (Android)')).toBe('mobile');
    });

    it('detects desktop devices', () => {
      expect(getDeviceType('Mozilla/5.0 (Windows NT 10.0)')).toBe('desktop');
    });
  });
});
```

### 8.3 E2E Tests

```typescript
// __tests__/e2e/seera-link.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Seera Link', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('create profile flow', async ({ page }) => {
    await page.goto('/dashboard/seera-link');
    await page.click('text=Create Profile');

    // Fill form
    await page.fill('[name="displayName"]', 'Test User');
    await page.fill('[name="title"]', 'Software Engineer');
    await page.fill('[name="slug"]', 'test-user-e2e');

    // Add highlight
    await page.click('text=Add Highlight');
    await page.fill('[name="highlights.0.content"]', 'Led team of 10 engineers');

    // Save
    await page.click('text=Save Draft');
    await expect(page.locator('text=Profile saved')).toBeVisible();

    // Publish
    await page.click('text=Publish');
    await expect(page.locator('text=Profile published')).toBeVisible();
  });

  test('visit public profile', async ({ page }) => {
    await page.goto('/p/test-user-e2e');
    await expect(page.locator('h1')).toContainText('Test User');
    await expect(page.locator('text=Software Engineer')).toBeVisible();
  });

  test('CTA click tracking', async ({ page }) => {
    await page.goto('/p/test-user-e2e');

    // Click email CTA
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('text=Email'),
    ]);

    // Verify analytics logged (check network request or database)
    // ...
  });

  test('view analytics', async ({ page }) => {
    await page.goto('/dashboard/seera-link');
    await page.click('text=View Analytics');

    await expect(page.locator('text=Views')).toBeVisible();
    await expect(page.locator('text=Last 7 days')).toBeVisible();
  });
});
```

---

## Appendix: Color Themes

```typescript
// src/lib/seera-link/themes.ts

export const themeColors = {
  obsidian: {
    primary: 'hsl(0 0% 9%)',
    secondary: 'hsl(0 0% 96%)',
    accent: 'hsl(262 83% 58%)',
  },
  sapphire: {
    primary: 'hsl(217 91% 60%)',
    secondary: 'hsl(214 32% 91%)',
    accent: 'hsl(262 83% 58%)',
  },
  emerald: {
    primary: 'hsl(160 84% 39%)',
    secondary: 'hsl(152 76% 91%)',
    accent: 'hsl(160 84% 39%)',
  },
  ruby: {
    primary: 'hsl(0 84% 60%)',
    secondary: 'hsl(0 86% 97%)',
    accent: 'hsl(0 84% 60%)',
  },
  amber: {
    primary: 'hsl(38 92% 50%)',
    secondary: 'hsl(48 96% 89%)',
    accent: 'hsl(38 92% 50%)',
  },
  slate: {
    primary: 'hsl(215 16% 47%)',
    secondary: 'hsl(210 40% 96%)',
    accent: 'hsl(262 83% 58%)',
  },
};
```

---

This specification provides a complete blueprint for implementing the Seera Link feature. The next step is to begin implementing the code files according to the plan.
