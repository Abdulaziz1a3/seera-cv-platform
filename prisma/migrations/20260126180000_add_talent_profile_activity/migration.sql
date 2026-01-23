-- Add talent profile view tracking
CREATE TABLE "TalentProfileView" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentProfileView_pkey" PRIMARY KEY ("id")
);

-- Add talent profile download tracking
CREATE TABLE "TalentProfileDownload" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentProfileDownload_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "TalentProfileView_recruiterId_candidateId_key" ON "TalentProfileView"("recruiterId", "candidateId");
CREATE INDEX "TalentProfileView_candidateId_idx" ON "TalentProfileView"("candidateId");
CREATE INDEX "TalentProfileView_recruiterId_idx" ON "TalentProfileView"("recruiterId");

CREATE UNIQUE INDEX "TalentProfileDownload_recruiterId_candidateId_key" ON "TalentProfileDownload"("recruiterId", "candidateId");
CREATE INDEX "TalentProfileDownload_candidateId_idx" ON "TalentProfileDownload"("candidateId");
CREATE INDEX "TalentProfileDownload_recruiterId_idx" ON "TalentProfileDownload"("recruiterId");

-- Foreign keys
ALTER TABLE "TalentProfileView" ADD CONSTRAINT "TalentProfileView_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TalentProfileView" ADD CONSTRAINT "TalentProfileView_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TalentProfileDownload" ADD CONSTRAINT "TalentProfileDownload_candidateId_fkey"
    FOREIGN KEY ("candidateId") REFERENCES "TalentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TalentProfileDownload" ADD CONSTRAINT "TalentProfileDownload_recruiterId_fkey"
    FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
