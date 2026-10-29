# DUA Cultural Signals — prototype

An independent, experimental application for the Qloo Agentic Hackathon. It helps a cultural programmer start from an artist reference, inspect possible matching entities, and explore related artists and films. It is not part of the production DUA platform and contains no DUA user data or proprietary code.

## Status

**Local development only; no entry has been submitted.** The Qloo access request was submitted on 29 October 2026 after consent; receipt of the key has not yet been confirmed and may take several business days. The actual API, public demo, and competition eligibility have not been verified. Search and recommendations intentionally report an unavailable state without a key; there are no built-in fake recommendations.

## Setup

Requires Node.js 20 or later. Copy `.env.example` into a local environment configuration or set the values manually. The key is server-only and must never be committed, placed in a browser bundle, logged, or sent in chat.

```sh
export QLOO_API_KEY='set privately'
node server.mjs
```

Open `http://127.0.0.1:3850`. Run `node --test` to exercise server-side behaviour using isolated test fixtures: no test calls external services. Qloo hackathon access uses `https://hackathon.api.qloo.com` and the `X-Api-Key` header. A correct response from the live API remains a requirement before claiming the prototype works.

The working application will require a separately reviewed public repository with an open-source licence and a publicly hosted demo. No existing DUA repository is to be made public for this submission. Do not commit API responses, keys, personal data, or DUA-specific code.

## Sources

- Contest rules: https://qloo.devpost.com/rules
- Developer guide: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide
- Entity search: https://docs.qloo.com/reference/get-search
- Recommendations: https://docs.qloo.com/reference/basic-insights-use-case

## Boundaries

Ranked matches are Qloo's cultural affinity signals, not evidence of availability, consent, nationality, collaboration, attendance, or audience size. Suggested actions in the brief are prompts for human review, not confirmed bookings or rights clearances. Users are told not to enter private personal data. The service does not persist searches or results.
