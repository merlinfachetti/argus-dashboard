# Argus Dashboard Roadmap

## Phase 0: Product framing and bootstrap

Status: completed

- Define product direction and MVP scope
- Choose project name and create app foundation
- Bootstrap profile from CV and LinkedIn data
- Add first target career portals

## Phase 1: MVP core flow

Status: in progress

Completed:
- Manual JD intake flow
- Heuristic job structuring
- Match scoring against profile
- Recruiter message draft generation
- Initial dashboard UI

Remaining:
- Persist data in database
- Add authenticated private access
- Save job lifecycle states
- Add profile editing UI

## Phase 2: Source ingestion

Status: not started

- Analyze Siemens, Bayer, SAP and Hensoldt career portals
- Decide source-by-source strategy: API, lightweight crawler, browser automation or manual fallback
- Build normalized ingestion pipeline
- Add retries and failure logging

## Phase 3: Automation and intelligence

Status: not started

- Scheduled daily collection
- Morning email digest
- Stronger fit model and ranking rules
- Gap detection per vacancy
- Application prioritization queue

## Phase 4: Production platform

Status: in progress

Completed:
- Local repository initialized
- CI workflow created
- Vercel project linked
- First production deployment created

Remaining:
- Create GitHub remote repository
- Push local repository to GitHub
- Enable branch protection and required checks
- Enable auto-merge for pull requests
- Connect GitHub to Vercel for preview deploys per PR

## Current blockers

- The provided GitHub token authenticates successfully, but it does not have permission to create repositories through the GitHub API.
- The current Vercel production URL responds with authentication protection enabled, which suggests deployment protection is active in the selected Vercel scope.

## Immediate next step

1. Create the GitHub repository `Argus-Dashboard` in the `merlinfachetti` account, or provide a GitHub token with repository creation permissions.
2. Push the existing local commit and attach the remote.
3. Enable GitHub + Vercel integration for PR previews.
4. Start Phase 2 with the first real portal connector.
