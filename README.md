# DUA Cultural Signals

A small, human-guided cultural discovery tool built for the Qloo Agentic Hackathon. Start with an artist, confirm their identity, choose a creative goal, and obtain cross-domain cultural references plus a practical review checklist.

## Run

Node.js 20+. No runtime dependencies. Set `QLOO_API_KEY` privately in the server environment, then run `npm start`. Open http://127.0.0.1:3850. The key must never be placed in browser code, committed, or included in a demo recording.

`npm test` runs isolated tests with synthetic fixtures and makes no provider calls. Real Qloo search and music/film insights were separately verified on 29 October 2026 with Cesária Évora as a public reference. The test suite is not a substitute for that live check.

## Judge walkthrough

1. Search for **Cesária Évora**.
2. Select the correct artist from Qloo's matches. This is an explicit human identity checkpoint.
3. Choose a live showcase, collaboration, or campaign.
4. Select **Explore connections**. The server verifies the reference, queries Qloo for artists and films, and composes a goal-specific research brief.
5. Add references with +, remove any that do not fit, then copy or download the Markdown brief. Try another reference or goal.

The app uses Qloo's `/search` and `/v2/insights` with `filter.type` and `signal.interests.entities`. All provider calls occur on the server. Provider errors, missing access and empty matches are shown explicitly; no synthetic data is substituted in the live application.

## Agentic tool boundary

This is a bounded discovery tool and deterministic orchestration workflow, not an autonomous LLM or a production DUA assistant. Its structured `/api/search` and `/api/brief` endpoints can be called by an agent. The human chooses the identity and goal; the tool executes the cross-domain research steps. It does not negotiate, contact anyone, purchase, book, clear rights, or invent a cultural interpretation. No LLM service is needed.

GET `/api/search?name=Ces%C3%A1ria%20%C3%89vora` returns candidate entities. GET `/api/brief?id=<verified-uuid>&name=<artist-name>&goal=showcase` returns `reference`, `goal`, `artists`, `films`, `actions`, and `source`. Goals: `showcase`, `campaign`, `collaboration`. A reference must match a fresh Qloo lookup before insights are requested.

## Honest limitations

Affinity is not nationality, availability, endorsement, audience demand, a booking recommendation, or proof of Lusophone representation. Results may include deceased artists. Use them as artistic references; identify performers independently. Qloo coverage may be uneven and results change over time. Review cultural context, rights, fees and consent with people.

The public demo uses a server-side hackathon key. It collects no DUA accounts, community posts, conversations or private information. It does not persist searches or results. Hosting/provider infrastructure may retain ordinary access logs. Enter public artist names only. The prototype's in-memory request throttle is per server instance, not a global billing cap or production-grade abuse system.

## Deployment

`vercel.json` serves `public/` and forwards API requests to `api/index.mjs`. Configure `QLOO_API_KEY` as a sensitive production environment variable, then deploy. Do not upload `.env*`, `.vercel/`, local validation harnesses or provider responses. The source is MIT licensed. This standalone repository contains no proprietary DUA production code.
