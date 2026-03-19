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

## CI pipeline

The GitHub workflow runs:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Next implementation steps

- Persist jobs and profile data in PostgreSQL
- Add authenticated private dashboard
- Add crawler orchestration and scheduled processing
- Generate morning email digest
- Connect Vercel previews and production deployment
