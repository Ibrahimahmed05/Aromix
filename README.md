# Aromix AI

Aromix AI is a full-stack fragrance copilot for deciding what to buy, wear, layer, avoid, or add to a personal cologne shelf.

## Tech Stack

- Frontend: plain `index.html`, `styles.css`, and `app.js`
- Backend: Node.js `server.js`
- AI reasoning: OpenAI, server-side only
- Fragrance profiles: RapidAPI Fragrance API, server-side only
- Live shopping: SerpAPI Google Shopping, server-side only
- Storage: localStorage for shelf/chat history and in-memory backend cache

## Features

- Aromix AI chat for buy advice, wear-today picks, layering, dupes, and shelf gaps
- Scent Builder for exploring note profiles and matching fragrances
- Fragrance Discovery with wearable-fragrance filtering
- Live Shopping with verified fragrance product filtering
- Dupe Finder with similarity score and confidence
- Layering Analysis with score, spray order, ratio, conflicts, and warnings
- My Shelf with Owned / Want / Sampled statuses
- Generated bottle placeholders when no safe image is available

## Screenshots

Add screenshots here after deployment:

- Aromix AI chat
- My Shelf
- Live Shopping
- Layering Analysis

## Local Setup

Use Node.js 18 or newer.

1. Copy `.env.example` to `.env`.
2. Fill in your real API keys locally.
3. Never commit `.env`.

Required environment variables:

```sh
PORT=4173
FRAGRANCE_PROVIDER=rapidapi
RAPIDAPI_HOST=fragrance-api.p.rapidapi.com
RAPIDAPI_KEY=your_rapidapi_key_here
SERPAPI_API_KEY=your_serpapi_key_here
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-5.2
DEBUG_API=false
FRAGELLA_ENABLED=false
```

Run locally:

```sh
npm start
```

or:

```sh
node server.js
```

Open:

```sh
http://localhost:4173
```

## Deployment

### Render

1. Create a Web Service.
2. Build command: `npm install` or leave blank if no install step is needed.
3. Start command: `npm start`.
4. Add the required environment variables in the Render dashboard.
5. Do not upload or commit `.env`.

### Railway

1. Create a Railway project from the repo.
2. Add the required environment variables in Railway Variables.
3. Start command: `npm start`.
4. Railway provides `PORT`; Aromix uses `process.env.PORT || 4173`.

## API Routes

Public routes:

- `GET /api/health`
- `GET /api/fragrance?query=Bleu%20de%20Chanel`
- `GET /api/search?q=cinnamon%20colognes`
- `GET /api/prices?query=Dior%20Sauvage`
- `POST /api/chat`
- `POST /api/dupe-finder`
- `POST /api/layering`

Debug routes are disabled unless `DEBUG_API=true`:

- `GET /debug/env`
- `GET /debug/rapidapi?query=Bleu%20de%20Chanel`
- `GET /debug/serpapi?query=Dior%20Sauvage`
- `POST /debug/chat-plan`

## Smoke Tests

```sh
curl -s "http://localhost:4173/api/health"
curl -s "http://localhost:4173/api/fragrance?query=Bleu%20de%20Chanel"
curl -s "http://localhost:4173/api/search?q=cinnamon%20colognes"
curl -s "http://localhost:4173/api/prices?query=Dior%20Sauvage"
curl -s -X POST "http://localhost:4173/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Find me a sweet winter cologne under $80","shelf":[]}'
curl -s -X POST "http://localhost:4173/api/layering" \
  -H "Content-Type: application/json" \
  -d '{"fragranceA":"Dior Sauvage","fragranceB":"Kayali Vanilla 28"}'
curl -s -X POST "http://localhost:4173/api/dupe-finder" \
  -H "Content-Type: application/json" \
  -d '{"fragranceName":"Althair"}'
```

## Security Notes

- API keys must only be stored in `.env` locally or in the hosting provider dashboard.
- `.env` and `.env.*` are ignored by Git, except `.env.example`.
- API keys are used server-side only and are never placed in frontend files.
- Debug routes are disabled unless `DEBUG_API=true`.
- Debug routes never return raw API keys.
- Public API errors return clean, user-safe messages without stack traces.
- Expensive API routes use basic in-memory rate limiting.
- External shopping links are validated and opened with `noopener noreferrer`.
- Security headers are set by the Node server.

## Known Limitations

- localStorage shelf/chat data is browser-local until authentication is added.
- Backend cache is in-memory and resets on restart/deploy.
- Fragrance profile coverage depends on upstream data quality.
- Rate limiting is in-memory and per instance; use platform-level protections for high traffic.
