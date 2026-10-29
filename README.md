# DUA Cultural Signals — Cultural Bridge

A human-guided research tool built for the Qloo Agentic Hackathon. A cultural programmer chooses two public artist references, and the tool compares Qloo's returned music and film results. It shows direct reference-to-reference signals, entities occurring in both bounded result sets, and the remaining source-specific references. It helps turn a research trail into a curated, exportable creative brief.

[Live demo](https://dua-cultural-signals-qloo.vercel.app) · [Machine-readable OpenAPI tool specification](https://dua-cultural-signals-qloo.vercel.app/openapi.json) · [DUA creative ecosystem](https://dua.2lados.pt/) · [DUA Community](https://dua.2lados.pt/feed) · [DUA Radar](https://dua.2lados.pt/radar-cultural)

This is a standalone open-source hackathon prototype inspired by the DUA ecosystem. It links to the real DUA Community, where people can browse creators and explore the community separately. Qloo references are research inspiration, not verified DUA profiles; the link does not search for selected artists. The tool does not log users into DUA, access DUA community data, or represent a feature already integrated into the main platform.

## Judge walkthrough

1. Select **Try a live example** to verify and compare Lura and Mayra Andrade in one step. Alternatively, search for and select both identities manually, choose **Live event**, and select **Build research brief**.
2. Open **How the research moved** to inspect the verified identities, returned sample sizes and actual follow-up decision. Select references with + and add your project context. The working outline uses only your selections.
3. Download the editorial PDF, including charts based on the returned samples, copy the brief or download Markdown. Preview and copy a collaboration note to edit and share yourself; the prototype sends nothing. Open the Community separately if you want to discover creators.
4. Optional: disable the comparison to explore a single reference instead; choose another pair to try a case with no overlap.

Qloo responses change. The walkthrough is not a promise that any particular result will always appear.

## What actually happens

The server rechecks both selected identities with Qloo `/search`, then independently requests artist and film `/v2/insights` for each artist. It compares **up to six returned entities per artist and domain** by canonical Qloo entity ID. `common` means a matching ID is in both returned samples; `onlyA` and `onlyB` are sample-specific, not proof that no other connection exists. `direct` records when one seed artist is in the other artist's returned music sample. If the initial artist and film samples have no shared entity, the tool performs at most two additional Qloo lookups: it explores up to the first two additional artists returned for the first seed and checks their returned music samples against the second seed's music sample. It stops when it finds a path or a provider request fails, and presents each research step or the limited no-match, no-candidate or unavailable state explicitly. If an essential initial provider call fails, the tool does not present a complete comparison.

The selected references, their provenance, goal, optional user-written project note and review checklist can be exported. A separate collaboration-note template uses the chosen references and the person's own context; the person chooses whether to copy, edit or share it. PDF charts show counts within the returned samples, not audience sizes or demand. The PDF is generated in the browser. The note stays in the browser and is not sent to the server or Qloo by the app. Searches contain only the artist names. No DUA account information or community content is used, and the app itself does not save searches; hosting providers may retain ordinary access logs.

This is a deterministic tool and not an autonomous LLM agent. Its documented endpoints and MCP adapter are suitable for a separately built agent to call; no integration into DUA Chat is claimed. Qloo returns cultural affinities, not the causal reasons for them. Do not infer demographic audience overlap, nationality, personal relationships, availability, rights clearance or endorsement. Results may contain deceased artists and must not be presented as a list of performers available to book. An empty intersection only describes the limited returned samples.

## Run locally

Node.js 20 or later. The server has no runtime dependencies. Set `QLOO_API_KEY` in a server-only environment, run `npm start`, and open http://127.0.0.1:3850. Use an authorized Qloo account and verify its licensing/usage conditions. Never commit credentials, place them in client code or include them in recordings.

Run `npm ci` once to install the pinned PDF test dependency; `npm test` then runs isolated tests without contacting Qloo. `node scripts/fixture-server.mjs` starts a local UI with explicitly labelled synthetic data for development only. The real example was separately exercised on 29 October 2026 with Qloo's hackathon API. The fixture is not evidence of a live API response. The vendored browser distribution is jsPDF 4.2.1 (MIT); Noto Sans fonts are provided under the SIL Open Font License. Their license files are in `public/vendor/`.

## Agent tool interface

`GET /api/search?name=...` returns candidate identities. After the caller has verified the identities, `GET /api/bridge?idA=...&nameA=...&idB=...&nameB=...&goal=showcase` returns the bounded comparison, method and review actions. Supported goals are `showcase`, `campaign` and `collaboration`. The [OpenAPI 3.1 specification](https://dua-cultural-signals-qloo.vercel.app/openapi.json) documents parameters, outputs and limits. The API does not accept the optional project note or access private DUA data.

The repository also includes a read-only MCP stdio adapter. Configure an MCP client to launch `node /absolute/path/to/mcp-server.mjs`; it exposes `search_artist` and `compare_cultural_references`. The client should first search, let the user select the identities, then compare using the returned IDs and a goal. The adapter calls the fixed public demo over HTTPS; it does not require or expose the Qloo key. Input names are sent to the public demo and Qloo, so use public artist names only. The MCP protocol handshake and tool calls have been exercised against both isolated fixtures and the live demo; connection to a particular third-party agent application has not been verified.

## Deployment and limitations

`vercel.json` serves `public/` and forwards API requests to `api/index.mjs`. Configure the Qloo key as a sensitive server environment variable. The demo's in-memory per-instance rate limiter is not a global quota or production-grade protection. Real production integration would need its own licensed access, privacy review and durable abuse/usage controls. This repository is MIT licensed and does not contain proprietary DUA production code.

## From references to a project
The creator chooses a showcase, collaboration or campaign. After curating references, the tool proposes a practical format, roles to find and a first deliverable. Optional audience, location and practical constraints remain in browser memory and are included in explicit exports only. These are transparent templates, not Qloo-generated production decisions. The site explains the future DUA project → collaboration request → Market integration separately from working external Community/Radar links. No DUA account or private data integration is implemented.

### Demo reference selection
The default pair is Lura / Mayra Andrade. Known historical names previously encountered are omitted before display through an explicit editorial exclusion list in `lib/qloo.mjs`. This list is not an exhaustive life-status registry: Qloo's normalized response does not verify whether every returned person is alive or available. Results remain cultural references, never verified hiring candidates.

### Example photographs (separate from the MIT code license)
- Lura, Cosmopolite, 22 April 2017: Photo: Tore Sætre / Wikimedia, CC BY-SA 4.0. https://commons.wikimedia.org/wiki/File:Lura_Cosmopolite_(221240).jpg
- Mayra Andrade, Central Park, 21 June 2009: Irn / Wikimedia, CC BY 3.0. https://commons.wikimedia.org/wiki/File:Mayra_Andrade.jpg
Unmodified image copies are served locally from Wikimedia sources, displayed with a circular CSS crop, identified beside each image; the underlying files are unmodified. The cropped presentation of the Lura photograph remains available under CC BY-SA 4.0; source and license links appear beside them. They identify the example references and do not imply endorsement. Other artists have no guessed or generated portraits.
