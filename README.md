# AI Semantic Gateway

A semantic caching layer for LLM APIs. Instead of matching prompts by exact string, it embeds them, finds semantically similar past prompts via vector similarity (pgvector cosine distance), and returns cached responses instead of re-calling the LLM.

The point: for use cases where users ask paraphrased versions of the same question ("How do I reset my password?" / "How can I reset my account password"), most LLM calls are wasted money. This service turns those into cheap vector lookups.

---

## Quick start (Docker — recommended)

You need Docker and Docker Compose.

```bash
# 1. Clone / cd into the project
cd ai-semantic-gateway

# 2. Copy the env file (defaults are fine for a demo)
cp .env.example .env

# 3. Build and start everything
docker compose up --build
```

Then open:

- **Frontend:** http://localhost:5173
- **Backend health:** http://localhost:8080/api/v1/health
- **Backend metrics:** http://localhost:8080/api/v1/metrics

To stop:

```bash
docker compose down
```

To wipe the cache and start fresh:

```bash
docker compose down -v
```

---

## Demo script (interview walkthrough)

1. **Open the frontend** at http://localhost:5173. You'll land on the Dashboard. Point out the top-right dot: green means the frontend actually reached the backend `/health` endpoint (it polls every 10s).

2. **Go to Playground.** This is the real interactive demo.

3. Send: **"How do I reset my password?"**
   - Response comes back with an amber `LLM CALL` badge — no cache hit yet because the cache is empty.

4. Send: **"How can I reset my account password"** (paraphrase)
   - Response comes back with a green `CACHE HIT` badge + a similarity score around 0.9x.
   - Nothing hit the LLM. That's the product.

5. Send: **"What is the weather today?"** (unrelated)
   - `LLM CALL` again — the cache correctly refused a false match.

6. Go back to Dashboard, hit Refresh. The **top row of cards is real backend data** (from `/api/v1/metrics`): request count, hit rate, estimated cost saved, uptime. The chart below is mock time-series.

7. Walk through the other pages (API Keys, Models, Analytics, Cost Tracking, Audit Logs, Settings) — these show the target UX. Be up front: **they're populated with mock data.** The backend endpoints to power them are the next sprint's work.

---

## What's real vs. mock (be honest in the interview)

| Component | Status |
|---|---|
| Backend cache-hit/miss logic | ✅ Real (Spring Boot + pgvector) |
| Input validation, exception handling | ✅ Real (Bean Validation + `@RestControllerAdvice`) |
| `/api/v1/query`, `/health`, `/metrics` | ✅ Real |
| Mock LLM mode (no OpenAI key needed) | ✅ Deterministic character-histogram embeddings; similar prompts land close in vector space |
| Playground page | ✅ Real (calls backend) |
| Dashboard top-row metrics + health indicator | ✅ Real (backend `/metrics`) |
| Login, Register | ⚠️ Mock — no auth backend yet (Priority 3 work) |
| Dashboard charts, API Keys, Models, Analytics, Cost Tracking, Audit Logs, Settings | ⚠️ Mock data, flagged in the UI with a "demo data" badge |

The intentional trade-off: broad UI surface (looks bigger) with clearly-labelled mock data, over narrow-but-fully-real. The badges make this defensible when you're asked "does the analytics page really work?" — answer: "no, the backend endpoints for time-series metrics are the next sprint. The badge in the corner is my reminder to myself. Here's the code that computes the real hit-rate stat on the dashboard — that one is live."

---

## Using a real OpenAI key

Edit `.env`:

```
OPENAI_MOCK=false
OPENAI_API_KEY=sk-...
```

Then restart: `docker compose down && docker compose up --build`.

**Warning for interviews:** if you're demoing on hotel wifi or corporate wifi, real API calls can be slow or blocked. Keep `OPENAI_MOCK=true` for the demo — the cache-hit/miss behavior still works because mock embeddings are deterministic and paraphrases still cluster.

---

## Local development (no Docker)

### Backend

```bash
cd services/semantic-gateway

# Postgres with pgvector — easiest via docker
docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=postgres pgvector/pgvector:pg16
# in another shell, run init.sql once against it

# Then start Spring Boot (needs Maven 3.9+ and JDK 21)
mvn spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 and hits `http://localhost:8080/api/v1` (default).

---

## Architecture (30 sec version)

```
┌──────────┐    HTTPS    ┌──────────┐    JDBC    ┌────────────┐
│ Frontend │─────────────▶  Backend │────────────▶  Postgres  │
│  React   │             │  Spring  │            │ + pgvector │
└──────────┘             └────┬─────┘            └────────────┘
                              │
                              ▼ (HTTPS, real mode only)
                         ┌──────────┐
                         │  OpenAI  │
                         └──────────┘
```

Query flow:
1. Frontend POSTs `/api/v1/query` with a prompt.
2. Backend embeds the prompt (OpenAI or mock).
3. Backend queries pgvector for the top-3 nearest neighbors by cosine distance.
4. If similarity ≥ threshold: return the cached response (no LLM call).
5. Otherwise: call the LLM, save `(prompt, response, embedding)` to pgvector, return the response.

---

## Project layout

```
ai-semantic-gateway/
├── docker-compose.yml
├── .env.example
├── services/
│   └── semantic-gateway/       # Spring Boot backend
│       ├── Dockerfile
│       ├── init.sql            # pgvector setup + table
│       ├── pom.xml
│       └── src/
└── frontend/                   # React + Vite + TS + Tailwind
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/client.ts       # axios wrapper
        ├── components/         # Layout, Sidebar, TopBar, UI primitives
        └── pages/              # Login, Dashboard, Playground, ApiKeys, ...
```

---

## Troubleshooting

**"Backend UNREACHABLE" in the top bar.** Backend hasn't finished starting or the DB isn't ready. `docker compose logs backend` will show what's happening. First boot takes ~30-60s because Maven downloads dependencies.

**`docker compose up --build` fails on the frontend build with npm errors.** Delete `frontend/node_modules` locally if it exists (Docker builds in a clean context, but a mismatched local install can leak in on some Docker setups).

**Playground returns 503 DATABASE_ERROR.** pgvector isn't loaded. Check `docker compose logs db` — you should see `CREATE EXTENSION` early on. If the DB started before `init.sql` was present, run `docker compose down -v` (this drops the volume) and `docker compose up --build` again.

**The similarity numbers in mock mode look weird.** Mock embeddings are a character histogram, not real semantic embeddings. They cluster paraphrases well enough for a demo but the exact numbers won't match production behavior. This is called out in the code (`OpenAIEmbeddingService.mockEmbedding` docstring).

---

## What's next (the honest roadmap)

See `docs/RISK_REGISTER.md` for tracked issues. Priorities 3-6 in the original plan cover authentication, rate limiting, async cache writes, and Testcontainers-backed integration tests.
