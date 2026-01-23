# Recruiter Dashboard (Talent Hunter - Growth)

## Migrations
- Run `npm run db:migrate` after pulling the new migration: `prisma/migrations/20260123121000_recruiter_growth_dashboard`.
- Run `npm run db:migrate` after pulling the education filters migration: `prisma/migrations/20260125104500_recruiter_education_filters`.
- Optional backfill for existing talent profiles: `npx ts-node scripts/backfill-talent-education.ts`.

## Routes
- UI: `/recruiters`, `/recruiters/jobs`, `/recruiters/jobs/[id]`, `/recruiters/search`, `/recruiters/shortlists`, `/recruiters/billing`, `/recruiters/candidates/[id]`.
- API: `/api/recruiters/jobs`, `/api/recruiters/jobs/[id]/analyze`, `/api/recruiters/jobs/[id]/recommendations`, `/api/recruiters/search`, `/api/recruiters/credits`, `/api/recruiters/credits/buy`, `/api/recruiters/cv/unlock`, `/api/recruiters/billing/checkout`, `/api/recruiters/billing/manage`.

## Billing configuration
- Growth plan and CV credit packs are defined in `src/lib/recruiter-billing.ts`.
- TuwaiqPay is still used for all payments. Ensure existing gateway env vars are set:
  - `NEXT_PUBLIC_APP_URL`
  - `TUWAIQPAY_BASE_URL`, `TUWAIQPAY_USERNAME`, `TUWAIQPAY_PASSWORD`, `TUWAIQPAY_WEBHOOK_URL`

## AI provider
- Uses the existing AI provider abstraction in `src/lib/ai/index.ts`.
- Supported env vars remain the same (`AI_PROVIDER`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`).

## Education filters and indicators
- TalentProfile fields added for recruiter education filters:
  - `highestDegreeLevel`, `primaryFieldOfStudy`, `normalizedFieldOfStudy`, `graduationYear`, `graduationDate`
  - `experienceBand`, `internshipCount`, `projectCount`, `freelanceCount`, `trainingFlag`
- Normalization logic lives in `src/lib/education-utils.ts` (`normalizeFieldOfStudy`, degree level inference).
- Recruiter filters (Talent Pool search) are optional and off by default:
  - Degree level, field of study, graduation year range, experience band.
- JD analysis now extracts education requirements:
  - `requiredDegreeLevel`, `preferredDegreeLevels`, `requiredFieldsOfStudy`, `preferredFieldsOfStudy`
  - Required degree/field filters are applied as hard filters in recommendations.
