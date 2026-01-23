-- Create enums
CREATE TYPE "DegreeLevel" AS ENUM ('DIPLOMA', 'BACHELOR', 'MASTER', 'PHD');
CREATE TYPE "ExperienceBand" AS ENUM ('STUDENT_FRESH', 'JUNIOR', 'MID', 'SENIOR');

-- Update TalentProfile education fields
ALTER TABLE "TalentProfile"
ADD COLUMN "highestDegreeLevel" "DegreeLevel",
ADD COLUMN "primaryFieldOfStudy" TEXT,
ADD COLUMN "normalizedFieldOfStudy" TEXT,
ADD COLUMN "graduationYear" INTEGER,
ADD COLUMN "graduationDate" TIMESTAMP(3),
ADD COLUMN "experienceBand" "ExperienceBand",
ADD COLUMN "internshipCount" INTEGER,
ADD COLUMN "projectCount" INTEGER,
ADD COLUMN "freelanceCount" INTEGER,
ADD COLUMN "trainingFlag" BOOLEAN;

-- Update RecruiterJobAnalysis with education insights
ALTER TABLE "RecruiterJobAnalysis"
ADD COLUMN "requiredDegreeLevel" "DegreeLevel",
ADD COLUMN "preferredDegreeLevels" "DegreeLevel"[] NOT NULL DEFAULT '{}'::"DegreeLevel"[],
ADD COLUMN "requiredFieldsOfStudy" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
ADD COLUMN "preferredFieldsOfStudy" TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

-- Indexes
CREATE INDEX "TalentProfile_highestDegreeLevel_idx" ON "TalentProfile"("highestDegreeLevel");
CREATE INDEX "TalentProfile_normalizedFieldOfStudy_idx" ON "TalentProfile"("normalizedFieldOfStudy");
CREATE INDEX "TalentProfile_graduationYear_idx" ON "TalentProfile"("graduationYear");
CREATE INDEX "TalentProfile_experienceBand_idx" ON "TalentProfile"("experienceBand");
CREATE INDEX "TalentProfile_highestDegreeLevel_normalizedFieldOfStudy_idx" ON "TalentProfile"("highestDegreeLevel", "normalizedFieldOfStudy");
