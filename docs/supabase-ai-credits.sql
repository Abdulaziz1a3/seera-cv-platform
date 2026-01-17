-- AI credits schema update (Supabase SQL Editor)
-- Adds UsageRecord credits tracking and new enum value.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UsageType' AND e.enumlabel = 'AI_CREDIT_TOPUP'
  ) THEN
    ALTER TYPE "UsageType" ADD VALUE 'AI_CREDIT_TOPUP';
  END IF;
END $$;

ALTER TABLE "UsageRecord"
  ADD COLUMN IF NOT EXISTS "credits" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "UsageRecord"
  ADD COLUMN IF NOT EXISTS "amountSar" DOUBLE PRECISION;
