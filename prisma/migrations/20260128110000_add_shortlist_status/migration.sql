-- Add shortlist status fields
CREATE TYPE "RecruiterShortlistStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'INTERVIEWED',
    'REJECTED',
    'OFFER'
);

ALTER TABLE "RecruiterShortlistCandidate"
ADD COLUMN "status" "RecruiterShortlistStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "RecruiterShortlistCandidate_shortlistId_status_idx"
    ON "RecruiterShortlistCandidate" ("shortlistId", "status");
CREATE INDEX "RecruiterShortlistCandidate_shortlistId_addedAt_idx"
    ON "RecruiterShortlistCandidate" ("shortlistId", "addedAt");
