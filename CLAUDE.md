# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

```sh
node server.js        # start on http://localhost:4173
npm start             # same
```

No build step. No transpilation. No framework. Edit files and restart the server.

## Smoke Testing

```sh
curl -s "http://localhost:4173/api/health"
curl -s "http://localhost:4173/api/fragrance?query=Bleu%20de%20Chanel"
curl -s "http://localhost:4173/api/search?q=citrus%20cologne"
curl -s "http://localhost:4173/api/prices?query=Dior%20Sauvage"
curl -s -X POST "http://localhost:4173/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Find me a citrus cologne","shelf":[]}'
curl -s -X POST "http://localhost:4173/api/layering" \
  -H "Content-Type: application/json" \
  -d '{"fragranceA":"Dior Sauvage","fragranceB":"Kayali Vanilla 28"}'
curl -s -X POST "http://localhost:4173/api/dupe-finder" \
  -H "Content-Type: application/json" \
  -d '{"fragranceName":"Althair"}'
```

Debug routes (only available when `DEBUG_API=true`):
```sh
curl -s "http://localhost:4173/debug/env"
curl -s "http://localhost:4173/debug/rapidapi?query=Sauvage"
curl -s -X POST "http://localhost:4173/debug/chat-plan" \
  -H "Content-Type: application/json" \
  -d '{"message":"Find me a sweet winter cologne"}'
```

## Architecture

### File layout
- `server.js` — the entire backend (~3600 lines). Node `http` only, no framework.
- `app.js` — the entire frontend (~2100 lines). Vanilla JS, no framework.
- `index.html` — single HTML page with all section markup.
- `styles.css` — all styles.
- `.env` — local secrets. Never commit. See `.env.example` for keys.

### Request flow
1. Browser → `server.js` HTTP handler (routes matched manually by pathname + method)
2. Route handler calls one or more data sources in parallel or waterfall
3. Response is always `sendJson()` with security headers from `SECURITY_HEADERS`

### Data sources (all server-side, keys never touch the browser)
- **RapidAPI Fragrance API** (`FRAGRANCE_PROVIDER=rapidapi`) — fragrance profiles, notes, accords, images
- **SerpAPI** — Google Shopping results for live prices and image fallbacks
- **OpenAI Responses API** (`/v1/responses`, `instructions` + `input` fields, reads `output_text`) — AI chat, layering explanations, dupe summaries, scent advice

### Fragrance resolution pipeline (`resolveFragranceQuery`)
Runs on every `/api/fragrance` and `/api/chat` call:
1. Check `curatedCatalog()` (merged `CURATED_DISCOVERY_LIBRARY` + `CURATED_ALIAS_LIBRARY`)
2. RapidAPI multi-search with up to 18 query variants (`fragranceSearchQueries`)
3. If still not found: SerpAPI web organic → parse candidates → re-look up via RapidAPI
4. If still not found: ask OpenAI to normalize the query into aliases, retry
5. Merge best hit with curated data via `mergeProfileData`
6. Ensure image via `ensureFragranceImage` (provider → curated cache → shopping thumbnail → generated SVG placeholder)

### Chat intent pipeline (`/api/chat`)
`buildChatContext` → `askOpenAiChat`:
1. `detectChatIntent` classifies into: `layering`, `dupe`, `shelf_gap`, `wear_today`, `buy_advice`, `shopping`, `fragrance_profile`, `recommend`
2. `extractUserConstraints` extracts budget, occasion, season, gender, notes wanted/avoided, category, vibe — **note: family names like "citrus" are mapped to specific notes here**
3. Each intent branch gathers its own data (profiles, layering analysis, dupes, shelf gaps)
4. `rankCandidates` scores candidates; `attachLiveOffers` enriches with live prices
5. Full context sent to `askOpenAiChat` → `callOpenAiJson` → `normalizeChatResponse`
6. Falls back to `buildChatFallback` if OpenAI is unavailable or rate-limited

### Curation layer
`CURATED_DISCOVERY_LIBRARY`, `CURATED_ALIAS_LIBRARY`, and `CURATED_DUPE_LIBRARY` in `server.js` are the ground truth for well-known fragrances. When adding a new fragrance to improve AI accuracy, add it to these arrays. `curatedCatalog()` merges both libraries by brand+name key.

### Scoring
- `scoreFragellaCandidate` — name/alias match score for picking the right API result
- `scoreResolvedProfile` — ranks resolved profiles (prefers more notes, curated data, real image)
- `rankCandidates` — chat recommendation ranking (note match + category + popularity + shelf overlap)
- `scoreNoteSet` / `calculateLayering` — blend builder and layering compatibility scores

### Frontend state
All state lives in a single `state` object in `app.js`. Shelf and chat history persist to `localStorage`. The `fragranceApiCache` Map caches `/api/fragrance` results within the session. `state.chatCardRegistry` maps rendered card keys to profile objects for "Add to Shelf" clicks — it's rebuilt on every `renderChat()` call.

### Image strategy
Provider image → curated image cache (`CURATED_IMAGE_CACHE`) → shopping thumbnail (SerpAPI) → generated SVG placeholder (`placeholderBottleSvg`). Placeholders are base64 SVGs generated server-side; `persistShelf()` strips them before writing to localStorage to avoid overflow.

## Environment Variables

| Variable | Purpose |
|---|---|
| `RAPIDAPI_KEY` | Fragrance API key |
| `RAPIDAPI_HOST` | `fragrance-api.p.rapidapi.com` |
| `SERPAPI_API_KEY` | Live prices + image fallbacks |
| `OPENAI_API_KEY` | AI chat and explanations |
| `OPENAI_MODEL` | Model name, defaults to `gpt-4o` |
| `DEBUG_API` | `true` to enable `/debug/*` routes and verbose logging |
| `DEV_MODE` | `true` also enables debug + `/api/bottle-art` |
| `FRAGELLA_ENABLED` | `true` to use Fragella as fragrance provider instead of RapidAPI |
| `PORT` | Defaults to `4173` |

## Key Patterns

**Adding a fragrance to the curated library** — add to both `CURATED_DISCOVERY_LIBRARY` (for discovery/matching) and `CURATED_ALIAS_LIBRARY` (for alias resolution and chat intent). Include `notes`, `vibe`, `gender`, `categoryLabel`, and `aliases`.

**Adding a known dupe pair** — add to `CURATED_DUPE_LIBRARY` with a `confidenceBoost` value (higher = shown first).

**Note family → note mapping** — `extractUserConstraints` in `server.js` maps family names ("citrus", "woody", etc.) to specific notes. If the AI returns wrong results for a note family query, check and extend this mapping.

**OpenAI calls** — always go through `callOpenAi` (plain text) or `callOpenAiJson` (parses JSON, strips markdown fences, falls back to provided `fallback`). Never call OpenAI directly from a route handler.

**Rate limiting** — in-memory, per IP, 10-minute windows. Heavy routes (chat, layering, dupe-finder, scent-advice): 20 req/window. Normal routes: 60 req/window.
