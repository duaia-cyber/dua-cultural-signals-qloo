# Qloo submission readiness — 29 October 2026

## Diagnosis and scope
The independent prototype now receives real Qloo results. Improve the creator workflow and submission clarity without claiming autonomous reasoning, production DUA integration, bookings, or benchmark superiority. Target users: cultural programmers and independent creators preparing a showcase, campaign or collaboration.

## Changes
- `public/`: concise identity, progress states, editable reference shortlist, Markdown export, responsive keyboard-accessible controls.
- `lib/`: retain verified Qloo results and goal-specific human-review actions; clarify deceased artists are references.
- `api/index.mjs`, `vercel.json`: isolated public deployment with server-only secret.
- `README.md`: installation, judge walkthrough, truthful limitations.

## Risks
API coverage, temporary errors and per-instance request limits. Never include key in logs, files, browser responses or repository. Shortlist stays in browser memory and no private DUA data is used. Public reference recommendations are not hiring suggestions.

## Validation and acceptance
Run unit tests and syntax checks sequentially. Exercise real search → identity selection → insights → shortlist → copy/export. Inspect desktop and 390/320px. Verify public API without login, failure states and absence of secret/config files from deploy. Publish only to the existing independent Qloo repo, update the existing Devpost draft, preserve draft status unless submission is requested.
