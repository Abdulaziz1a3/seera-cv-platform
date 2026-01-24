-- Add citizenship enum + column for user profiles
CREATE TYPE "Citizenship" AS ENUM (
    'SAUDI',
    'UAE',
    'QATAR',
    'BAHRAIN',
    'KUWAIT',
    'OMAN',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);

ALTER TABLE "UserProfile"
ADD COLUMN "citizenship" "Citizenship";

CREATE INDEX "UserProfile_citizenship_idx" ON "UserProfile" ("citizenship");

-- Enforce citizenship when joining the Talent Pool
CREATE OR REPLACE FUNCTION "ensure_talent_profile_citizenship"() RETURNS trigger AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "UserProfile"
        WHERE "userId" = NEW."userId"
          AND "citizenship" IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'Citizenship is required to join the Talent Pool';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "talent_profile_require_citizenship" ON "TalentProfile";
CREATE TRIGGER "talent_profile_require_citizenship"
BEFORE INSERT ON "TalentProfile"
FOR EACH ROW EXECUTE FUNCTION "ensure_talent_profile_citizenship"();
