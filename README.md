# Argus

Argus is a private job radar focused on collecting, structuring and prioritizing opportunities that match Merlin Fachetti's profile.

## Current scope

- Profile bootstrapped from CV and LinkedIn data
- Manual intake flow for messy job descriptions
- Structured vacancy output with heuristics
- Match score and risk summary against the candidate profile
- Recruiter outreach draft generation
- Initial dashboard for tracked opportunities
- First batch of target career portals

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- GitHub Actions
- Vercel-ready deployment

## Local setup

```bash
nvm use
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL`
- `DIRECT_URL`
- `ARGUS_ACCESS_PASSWORD`
- `ARGUS_SESSION_SECRET`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `ARGUS_DIGEST_FROM_EMAIL`
- `ARGUS_DIGEST_TO_EMAIL`

If `ARGUS_ACCESS_PASSWORD` and `ARGUS_SESSION_SECRET` are defined, the app is protected by private login at `/login`.

## CI pipeline

The GitHub workflow runs:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Database deployment

Generate and validate Prisma locally:

```bash
npm run prisma:generate
npm run prisma:validate
```

When a production database is configured, deploy migrations with:

```bash
npm run prisma:migrate:deploy
```

The repository already includes an initial Prisma migration baseline in `prisma/migrations/202603220001_initial_schema`.

## Daily digest automation

- Preview route: `/digests`
- Preview API: `GET /api/digests/today`
- Manual send API: `POST /api/digests/send`
- Scheduled cron route: `GET /api/cron/daily-digest`

`vercel.json` schedules the cron at `0 6 * * *` UTC. On March 22, 2026 this corresponds to `07:00` in Berlin; after daylight saving starts on March 29, 2026 it becomes `08:00` in Berlin.

The cron endpoint expects `Authorization: Bearer <CRON_SECRET>`. Email delivery uses Resend through the REST API.

## Next implementation steps

- Finish production database provisioning and apply migrations
- Add crawler orchestration and scheduled processing
- Generate morning email digest
- Connect Vercel previews and production deployment
