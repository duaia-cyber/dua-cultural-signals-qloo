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

If the first artist and film samples contain no shared entity, automatically explore up to two artists from the first sample and check whether their returned artist samples intersect the second artist's sample. Stop as soon as a path is found or a provider fails. Explain every step, keep a strict limit of two extra Qloo requests, show no-route and unavailable states, and never infer a personal relationship or an audience metric. This is a deterministic research tool; do not claim an autonomous LLM or guarantee contest qualification.

### Ease of use and community handoff

Add an optional one-click live example that resolves real artist identities through Qloo and never substitutes fixtures. Offer an explicit user-initiated community search for a selected public reference name, without matching identities or transferring project notes. Verify that DUA's real people-search route accepts the query and handles empty results. Produce an editable, traceable brief with a useful outline and clear limits.
## Agent tool integration

Expose the existing verified search and comparison as a read-only MCP stdio tool, so an agent can discover and call it using the live demo without receiving the Qloo secret. Keep the public demo as the source of results, validate inputs, handle provider errors and verify the protocol and tool calls with local fixtures and a real read-only request. Do not claim an autonomous language-model agent or a DUA production integration.

## Editorial PDF and charts

Add an optional PDF export generated entirely in the browser with embedded, open-licensed fonts and a pinned local PDF library. Reuse the real selected references, provenance, brief note, research trace and review checklist. Show two source-comparison charts from the actual returned artist and film samples; label them as sample counts, never audiences or impact. Support pagination, accents, honest empty states and failure messages. Preserve Markdown and copy actions. Generate a PDF from real public Qloo results, inspect text, charts and page layout, test long content and mobile UI, then publish the verified standalone demo and update the existing draft without submitting it.

## Useful project handoff
Clarify the creator job in the hero. Add a local project canvas (audience, place and practical constraint), a goal-specific action plan and an explicit proposed DUA integration map. Keep all user context in browser memory; include it in PDF/Markdown only on export. Changing the project goal invalidates the existing brief to preserve consistent review steps. Test all three goals, missing inputs and export consistency; inspect desktop/mobile with disposable fixtures. No production DUA integration or contest-result claims.

## Simplify interface and default example
Replace the historical default pair with Lura and Mayra Andrade; keep manual research available. Replace the native goal dropdown with accessible radio choices and shorten prominent copy, moving methodology to disclosure. Do not claim the provider validates life status or availability; a catalog-wide living-only filter cannot be asserted from the current API fields. Verify local UI, tests and live default results before publication.
