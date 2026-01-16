-- Create TalentProfile table
CREATE TABLE "TalentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "currentTitle" TEXT,
    "currentCompany" TEXT,
    "location" TEXT,
    "yearsExperience" INTEGER,
    "skills" TEXT[] NOT NULL,
    "education" TEXT,
    "summary" TEXT,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'open_to_offers',
    "desiredSalaryMin" INTEGER,
    "desiredSalaryMax" INTEGER,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "hideCurrentEmployer" BOOLEAN NOT NULL DEFAULT false,
    "hideSalaryHistory" BOOLEAN NOT NULL DEFAULT true,
    "verifiedCompaniesOnly" BOOLEAN NOT NULL DEFAULT false,
    "noticePeriod" TEXT,
    "preferredLocations" TEXT[] NOT NULL,
    "preferredIndustries" TEXT[] NOT NULL,
    "desiredRoles" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);

-- Create RecruiterShortlist table
CREATE TABLE "RecruiterShortlist" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterShortlist_pkey" PRIMARY KEY ("id")
);

-- Create RecruiterShortlistCandidate table
CREATE TABLE "RecruiterShortlistCandidate" (
    "id" TEXT NOT NULL,
    "shortlistId" TEXT NOT NULL,
    "talentProfileId" TEXT NOT NULL,
    "note" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruiterShortlistCandidate_pkey" PRIMARY KEY ("id")
);

-- Create RecruiterSavedSearch table
CREATE TABLE "RecruiterSavedSearch" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruiterSavedSearch_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "TalentProfile_userId_key" ON "TalentProfile"("userId");
CREATE INDEX "TalentProfile_resumeId_idx" ON "TalentProfile"("resumeId");
CREATE INDEX "TalentProfile_location_idx" ON "TalentProfile"("location");
CREATE INDEX "TalentProfile_availabilityStatus_idx" ON "TalentProfile"("availabilityStatus");
CREATE INDEX "TalentProfile_yearsExperience_idx" ON "TalentProfile"("yearsExperience");

CREATE INDEX "RecruiterShortlist_recruiterId_idx" ON "RecruiterShortlist"("recruiterId");
CREATE INDEX "RecruiterShortlistCandidate_talentProfileId_idx" ON "RecruiterShortlistCandidate"("talentProfileId");
CREATE UNIQUE INDEX "RecruiterShortlistCandidate_shortlistId_talentProfileId_key" ON "RecruiterShortlistCandidate"("shortlistId", "talentProfileId");
CREATE INDEX "RecruiterSavedSearch_recruiterId_idx" ON "RecruiterSavedSearch"("recruiterId");

-- Foreign keys
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_resumeId_fkey"
    FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecruiterShortlist" ADD CONSTRAINT "RecruiterShortlist_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecruiterShortlistCandidate" ADD CONSTRAINT "RecruiterShortlistCandidate_shortlistId_fkey"
    FOREIGN KEY ("shortlistId") REFERENCES "RecruiterShortlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruiterShortlistCandidate" ADD CONSTRAINT "RecruiterShortlistCandidate_talentProfileId_fkey"
    FOREIGN KEY ("talentProfileId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecruiterSavedSearch" ADD CONSTRAINT "RecruiterSavedSearch_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
