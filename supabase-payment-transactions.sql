DO $$ BEGIN
    CREATE TYPE "PaymentProvider" AS ENUM ('TUWAIQPAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentPurpose" AS ENUM ('SUBSCRIPTION', 'AI_CREDITS', 'GIFT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'TUWAIQPAY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" "PaymentPurpose" NOT NULL,
    "userId" TEXT,
    "providerTransactionId" TEXT,
    "providerBillId" TEXT,
    "providerReference" TEXT,
    "paymentLink" TEXT,
    "amountSar" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "plan" "PlanType",
    "interval" "GiftInterval",
    "credits" DOUBLE PRECISION,
    "recipientEmail" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "giftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_providerTransactionId_key"
    ON "PaymentTransaction"("providerTransactionId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_providerBillId_key"
    ON "PaymentTransaction"("providerBillId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_provider_idx"
    ON "PaymentTransaction"("provider");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_status_idx"
    ON "PaymentTransaction"("status");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_purpose_idx"
    ON "PaymentTransaction"("purpose");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_userId_idx"
    ON "PaymentTransaction"("userId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_giftId_idx"
    ON "PaymentTransaction"("giftId");

DO $$ BEGIN
    ALTER TABLE "PaymentTransaction"
        ADD CONSTRAINT "PaymentTransaction_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PaymentTransaction"
        ADD CONSTRAINT "PaymentTransaction_giftId_fkey"
        FOREIGN KEY ("giftId") REFERENCES "GiftSubscription"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
