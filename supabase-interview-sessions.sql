-- Create InterviewSession table for live interview history + recordings

CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "targetRole" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "interviewLang" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "summary" JSONB,
    "results" JSONB,
    "transcript" JSONB,
    "recordingUrl" TEXT,
    "recordingProvider" TEXT,
    "recordingBucket" TEXT,
    "recordingPath" TEXT,
    "recordingMimeType" TEXT,
    "recordingDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InterviewSession_userId_idx" ON "InterviewSession"("userId");
CREATE INDEX "InterviewSession_createdAt_idx" ON "InterviewSession"("createdAt");

ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_resumeId_fkey"
    FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
