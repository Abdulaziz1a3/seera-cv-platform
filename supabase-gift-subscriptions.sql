-- CreateEnum
CREATE TYPE "GiftInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('PENDING', 'REDEEMED', 'EXPIRED', 'CANCELED');

-- CreateTable
CREATE TABLE "GiftSubscription" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "message" TEXT,
    "plan" "PlanType" NOT NULL DEFAULT 'PRO',
    "interval" "GiftInterval" NOT NULL,
    "status" "GiftStatus" NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "amountSar" DOUBLE PRECISION,
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "redeemedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftSubscription_token_key" ON "GiftSubscription"("token");

-- CreateIndex
CREATE UNIQUE INDEX "GiftSubscription_stripeSessionId_key" ON "GiftSubscription"("stripeSessionId");

-- CreateIndex
CREATE INDEX "GiftSubscription_createdByUserId_idx" ON "GiftSubscription"("createdByUserId");

-- CreateIndex
CREATE INDEX "GiftSubscription_recipientEmail_idx" ON "GiftSubscription"("recipientEmail");

-- CreateIndex
CREATE INDEX "GiftSubscription_status_idx" ON "GiftSubscription"("status");

-- CreateIndex
CREATE INDEX "GiftSubscription_expiresAt_idx" ON "GiftSubscription"("expiresAt");

-- AddForeignKey
ALTER TABLE "GiftSubscription" ADD CONSTRAINT "GiftSubscription_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftSubscription" ADD CONSTRAINT "GiftSubscription_redeemedByUserId_fkey"
FOREIGN KEY ("redeemedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
