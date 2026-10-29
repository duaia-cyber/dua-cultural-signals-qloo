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

## Follow-up: cultural bridges and connection to the ecosystem

Objective: help a cultural programmer compare two verified artist references and understand where Qloo returns an overlapping research signal. Preserve the single-reference flow.

- Query each selected reference separately for artists and films. Compare the six returned entities per source and domain by canonical ID, never by guessed name. Separate common results, reference-to-reference signals and source-specific results; explain that the sample is limited and that absence in it is not proof of no affinity.
- Require distinct, verified references; return an honest error for provider failure or partial data. No fake matches, scores, audience overlap, bookings or implied endorsement.
- Let users curate either type of result and export provenance in the brief. Keep review and rights checks human-led. Show appropriate empty and loading states.
- Link clearly to the real public DUA ecosystem and distinguish the open-source competition prototype from any future product integration. Do not connect user accounts, send private DUA data to Qloo, or put the hackathon credential in the production platform.
- Update the draft narrative and public source to match what has actually been deployed. Verify isolated tests, local UI including mobile and actual Qloo results before publishing; keep Devpost in draft pending explicit submission instruction.

### Bounded adaptive exploration

If the first artist and film samples contain no shared entity, automatically explore one artist from the first sample and check whether its returned artist sample intersects the second artist's sample. Explain all steps, keep a strict limit of one extra Qloo request, show no-route and unavailable states, and never infer a personal relationship or an audience metric. This is a deterministic research tool; do not claim an autonomous LLM or guarantee contest qualification.
