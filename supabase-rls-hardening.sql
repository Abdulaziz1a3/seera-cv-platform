-- Supabase RLS hardening for Seera AI
--
-- This app uses NextAuth + Prisma, not Supabase Auth. Because of that, there is
-- no safe auth.uid()-based ownership policy to apply to these tables today.
--
-- The safest default is:
-- 1. Enable RLS on every application table in the public schema
-- 2. Add no anon/authenticated policies, which keeps the Supabase Data API closed
-- 3. Continue using server-side Prisma and service-role-backed signed URLs
--
-- Note:
-- - Do NOT use FORCE ROW LEVEL SECURITY here. Prisma/backend access may rely on
--   the database owner role.
-- - storage.objects already has RLS enabled in Supabase by default.

DO $$
DECLARE
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        '"User"',
        '"Account"',
        '"Session"',
        '"VerificationToken"',
        '"UserProfile"',
        '"Resume"',
        '"TalentProfile"',
        '"TalentProfileContact"',
        '"RecruiterShortlist"',
        '"RecruiterShortlistCandidate"',
        '"RecruiterSavedSearch"',
        '"RecruiterJob"',
        '"RecruiterJobAnalysis"',
        '"RecruiterJobRecommendation"',
        '"RecruiterCreditLedger"',
        '"CvUnlock"',
        '"TalentProfileView"',
        '"TalentProfileDownload"',
        '"ResumeVersion"',
        '"ResumeSection"',
        '"JobTarget"',
        '"JobTargetResume"',
        '"JobApplication"',
        '"ApplicationNote"',
        '"Contact"',
        '"Export"',
        '"Subscription"',
        '"InterviewSession"',
        '"GiftSubscription"',
        '"PaymentTransaction"',
        '"UsageRecord"',
        '"Template"',
        '"BlogPost"',
        '"KnowledgeBaseArticle"',
        '"SupportTicket"',
        '"TicketResponse"',
        '"AuditLog"',
        '"FeatureFlag"',
        '"RateLimitRecord"',
        'seera_profiles',
        'seera_profile_highlights',
        'seera_profile_experiences',
        'seera_profile_projects',
        'seera_profile_certificates',
        'seera_profile_analytics',
        'reserved_slugs'
    ]
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%s ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- Verification query: tables in public that still do not have RLS enabled.
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT rowsecurity
ORDER BY tablename;
