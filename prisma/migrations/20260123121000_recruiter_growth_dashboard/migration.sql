-- Add enum values
ALTER TYPE "PlanType" ADD VALUE 'GROWTH';
ALTER TYPE "PaymentPurpose" ADD VALUE 'RECRUITER_CV_CREDITS';

-- Create enums
CREATE TYPE "RecruiterJobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "RecruiterCreditType" AS ENUM ('PERIOD_GRANT', 'PURCHASE', 'SPEND_UNLOCK', 'ADJUSTMENT');

-- Create RecruiterJob table
CREATE TABLE "RecruiterJob" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "orgId" TEXT,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "remoteAllowed" BOOLEAN NOT NULL DEFAULT false,
    "employmentType" TEXT,
    "seniority" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "jdText" TEXT NOT NULL,
    "status" "RecruiterJobStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterJob_pkey" PRIMARY KEY ("id")
);

-- Create RecruiterJobAnalysis table
CREATE TABLE "RecruiterJobAnalysis" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "mustHaveSkills" TEXT[] NOT NULL,
    "niceToHaveSkills" TEXT[] NOT NULL,
    "roleKeywords" TEXT[] NOT NULL,
    "yearsExpMin" INTEGER,
    "yearsExpMax" INTEGER,
    "languages" TEXT[] NOT NULL,
    "responsibilities" TEXT[] NOT NULL,
    "redFlags" TEXT[] NOT NULL,
    "summary" TEXT,
    "weights" JSONB,
    "modelInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterJobAnalysis_pkey" PRIMARY KEY ("id")
);

-- Create RecruiterJobRecommendation table
CREATE TABLE "RecruiterJobRecommendation" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "reasons" JSONB NOT NULL,
    "gaps" JSONB NOT NULL,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterJobRecommendation_pkey" PRIMARY KEY ("id")
);

-- Create RecruiterCreditLedger table
CREATE TABLE "RecruiterCreditLedger" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "type" "RecruiterCreditType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "subscriptionId" TEXT,
    "paymentTransactionId" TEXT,
    "cvUnlockId" TEXT,
    "reference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterCreditLedger_pkey" PRIMARY KEY ("id")
);

-- Create CvUnlock table
CREATE TABLE "CvUnlock" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvUnlock_pkey" PRIMARY KEY ("id")
);

-- Create TalentProfileContact table
CREATE TABLE "TalentProfileContact" (
    "id" TEXT NOT NULL,
    "talentProfileId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "websiteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProfileContact_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "RecruiterJob_recruiterId_idx" ON "RecruiterJob"("recruiterId");
CREATE INDEX "RecruiterJob_status_idx" ON "RecruiterJob"("status");
CREATE INDEX "RecruiterJob_createdAt_idx" ON "RecruiterJob"("createdAt");

CREATE INDEX "RecruiterJobAnalysis_jobId_idx" ON "RecruiterJobAnalysis"("jobId");
CREATE INDEX "RecruiterJobAnalysis_createdAt_idx" ON "RecruiterJobAnalysis"("createdAt");

CREATE UNIQUE INDEX "RecruiterJobRecommendation_jobId_candidateId_key" ON "RecruiterJobRecommendation"("jobId", "candidateId");
CREATE INDEX "RecruiterJobRecommendation_jobId_idx" ON "RecruiterJobRecommendation"("jobId");
CREATE INDEX "RecruiterJobRecommendation_analysisId_idx" ON "RecruiterJobRecommendation"("analysisId");
CREATE INDEX "RecruiterJobRecommendation_candidateId_idx" ON "RecruiterJobRecommendation"("candidateId");

CREATE INDEX "RecruiterCreditLedger_recruiterId_idx" ON "RecruiterCreditLedger"("recruiterId");
CREATE INDEX "RecruiterCreditLedger_type_idx" ON "RecruiterCreditLedger"("type");
CREATE INDEX "RecruiterCreditLedger_createdAt_idx" ON "RecruiterCreditLedger"("createdAt");
CREATE UNIQUE INDEX "RecruiterCreditLedger_type_reference_key" ON "RecruiterCreditLedger"("type", "reference");
CREATE UNIQUE INDEX "RecruiterCreditLedger_cvUnlockId_key" ON "RecruiterCreditLedger"("cvUnlockId");

CREATE UNIQUE INDEX "CvUnlock_recruiterId_candidateId_key" ON "CvUnlock"("recruiterId", "candidateId");
CREATE INDEX "CvUnlock_candidateId_idx" ON "CvUnlock"("candidateId");

CREATE UNIQUE INDEX "TalentProfileContact_talentProfileId_key" ON "TalentProfileContact"("talentProfileId");
CREATE INDEX "TalentProfileContact_talentProfileId_idx" ON "TalentProfileContact"("talentProfileId");

-- Foreign keys
ALTER TABLE "RecruiterJob" ADD CONSTRAINT "RecruiterJob_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecruiterJobAnalysis" ADD CONSTRAINT "RecruiterJobAnalysis_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "RecruiterJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecruiterJobRecommendation" ADD CONSTRAINT "RecruiterJobRecommendation_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "RecruiterJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruiterJobRecommendation" ADD CONSTRAINT "RecruiterJobRecommendation_analysisId_fkey"
    FOREIGN KEY ("analysisId") REFERENCES "RecruiterJobAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruiterJobRecommendation" ADD CONSTRAINT "RecruiterJobRecommendation_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecruiterCreditLedger" ADD CONSTRAINT "RecruiterCreditLedger_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruiterCreditLedger" ADD CONSTRAINT "RecruiterCreditLedger_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecruiterCreditLedger" ADD CONSTRAINT "RecruiterCreditLedger_paymentTransactionId_fkey"
    FOREIGN KEY ("paymentTransactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RecruiterCreditLedger" ADD CONSTRAINT "RecruiterCreditLedger_cvUnlockId_fkey"
    FOREIGN KEY ("cvUnlockId") REFERENCES "CvUnlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CvUnlock" ADD CONSTRAINT "CvUnlock_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CvUnlock" ADD CONSTRAINT "CvUnlock_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TalentProfileContact" ADD CONSTRAINT "TalentProfileContact_talentProfileId_fkey"
    FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
