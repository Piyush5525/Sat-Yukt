# Sat-Yukt Backend

FastAPI backend for Sat-Yukt: verifies claims by matching them against a
curated dataset of known Indian misinformation examples via embedding
similarity (local, multilingual, no API cost), then asks Google Gemini to
produce a verdict, confidence score, and plain-language explanation grounded
in that evidence — following the AI layer's master prompt, which enforces
hard safety rules (never guess without evidence, always include a safety
instruction for claims involving financial action).

## Setup

1. **Install dependencies** (Python 3.11+ recommended):

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Fill in `GEMINI_API_KEY` (free key, no card required — see
   https://aistudio.google.com/apikey). Leave `FRONTEND_URL` and
   `DATABASE_URL` as-is for local dev unless you need to change them. No key
   is needed for retrieval — see below.

3. **Run the dev server**:

   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8000`. Interactive docs at
   `http://localhost:8000/docs`.

   On startup, the retriever loads a local multilingual embedding model
   (`paraphrase-multilingual-MiniLM-L12-v2`, downloaded automatically on
   first run, ~470MB) and embeds all 18 entries in `data/claims.json`
   in-memory — no separate generation step or cache file needed. This can
   take 10-20s on a cold start; the server doesn't accept requests until
   it's done (see `verify_service.preload_retriever()` in `main.py`).

## API

- `POST /verify` — `{ text, language, mode }` → verdict, confidence, explanation, source
- `POST /flag` — `{ claim_id }` → `{ status: "ok" }`
- `GET /recent-claims` — most recent 20 claims, newest first
- `POST /whatsapp/greenapi` — Green API WhatsApp webhook (the live WhatsApp integration)
- `POST /whatsapp` — Twilio WhatsApp webhook (kept for reference; Twilio's free
  sandbox does not reliably deliver for non-US numbers, so Green API is primary)

See `models/schemas.py` for the exact Pydantic shapes on `/verify`, `/flag`,
and `/recent-claims` — they match the frontend's contract exactly.

## AI layer

The AI layer lives in `services/{retrieval,confidence,ai_verify}.py` and
`data/{claims.json,master_prompt.txt}`:

- **`services/retrieval.py`** (`ClaimRetriever`) — loads `data/claims.json`
  (18 curated claims: real government schemes, known scams, health
  misinformation) and embeds every entry once at startup using a local
  multilingual sentence-transformers model. `retrieve(query)` returns
  `(matched_claim_or_None, similarity_score)`. Below `DEFAULT_THRESHOLD`
  (0.50), the match is `None` — the claim is *always* routed to
  `unverifiable`, never guessed at from the LLM's general knowledge.
- **`services/confidence.py`** — derives the final confidence score from the
  raw cosine similarity, not from whatever number the LLM puts in its JSON
  response (that value is discarded and recomputed). This is a deliberate,
  disclosed prototype simplification, not a trained classifier.
- **`data/master_prompt.txt`** — the exact LLM prompt (do not rewrite its
  rules section). Hard rules include: never state true/false without
  matching evidence; explanations must use plain, non-technical language;
  any claim involving financial action (sending money, clicking a link,
  sharing bank/Aadhaar/OTP details) that resolves to false/unverifiable
  *must* include an explicit safety instruction in the explanation.
- **`services/ai_verify.py`** — orchestrates the above into
  `verify_claim(text, language, retriever) -> dict`, calling Gemini
  (`gemini-2.5-flash`, with fallback model ids tried in order) and
  defensively parsing its JSON response. Never raises — malformed output or
  an API failure returns a safe `unverifiable` fallback dict.
- **`services/verify_service.py`** is the FastAPI-facing adapter: it owns
  the `ClaimRetriever` singleton (initialized once at startup via
  `preload_retriever()`, never per-request), runs the AI layer's
  synchronous `verify_claim()` in a thread with a hard timeout (30s) so a
  slow LLM call can never hang a request, maps the AI layer's `None`
  source fields to the API contract's plain strings, and persists the
  result to the `claims` table.

## Architecture notes

- **`services/verify_service.verify_claim(text, language, mode, db)`** is a
  plain async function with no HTTP/FastAPI dependencies — it takes a
  SQLAlchemy `Session`, not a request object. This means it can be (and
  already is) called identically from `routes/verify.py`,
  `routes/whatsapp.py`, and `routes/whatsapp_greenapi.py` with zero
  per-channel logic duplicated.
- **Retrieval threshold**: `DEFAULT_THRESHOLD` in `services/retrieval.py`
  (currently `0.50`, tuned for the `paraphrase-multilingual-MiniLM-L12-v2`
  model) controls how close an incoming claim must be to a dataset entry
  before it's treated as usable evidence. Below that, the claim is always
  `unverifiable` — the LLM is never asked to guess without matching
  evidence, by design (this is a hard rule enforced in both the retrieval
  layer and the master prompt itself).
- **Graceful degradation**: if local embedding fails, the Gemini API call
  fails or times out, or Gemini's response can't be parsed as valid JSON,
  `/verify` (and both WhatsApp routes) still return a valid response — a
  safe `unverifiable` fallback — instead of a 500 or an indefinite hang.
- **mode "voice" / "photo"**: this backend only ever reasons over plain
  text. Any speech-to-text or image OCR needed to produce that text is
  assumed to happen upstream (currently client-side in the frontend, via
  the Web Speech API and tesseract.js respectively).

## Deploying (Render / Railway)

Both platforms can run this as-is:

- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Set the same environment variables as `.env` in the platform's dashboard.
- The embedding model downloads automatically on first startup — no
  separate generation/caching step needed, but expect a slower first boot.
- SQLite's file (`sat_yukt.db`) lives on local disk — fine for a prototype,
  but note that most free-tier deploys don't persist disk across restarts.
  Swap `DATABASE_URL` for a managed Postgres instance before relying on
  claim history in production.
