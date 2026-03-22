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

## Next implementation steps

- Finish production database provisioning and apply migrations
- Add crawler orchestration and scheduled processing
- Generate morning email digest
- Connect Vercel previews and production deployment
