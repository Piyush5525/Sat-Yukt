# Sat-Yukt — Prototype Build Plan

**Team Room118 · Turing Hacks 4.0 · Problem Statement 06**

This is a working scope for the hackathon prototype — not the full four-channel vision from the pitch deck. For a demo, build **one channel deeply** (the website) and **fake the rest convincingly** in the pitch. Trying to build website + WhatsApp + IVR + chatbot all at once in a hackathon timeframe is how nothing ends up working. Below is what to actually build, organized by layer.

---

## 0. What "done" looks like for the demo

A judge should be able to:
1. Open the site, and within 3 seconds understand what it does without reading a paragraph
2. Tap the mic (or type/paste), submit a suspicious claim
3. See a verdict come back with a confidence score, a plain-language explanation, and a source
4. Hear it read aloud
5. See at least one thing that shows "this understands regional language / low-literacy users," even if mocked

That's the whole demo. Everything below serves that.

---

## 1. Frontend

### Stack
- **React + Vite** (faster dev loop than Next.js for a hackathon; skip SSR, you don't need it for a demo)
- **Tailwind CSS** for styling
- **Framer Motion** for animation (see section 4)
- Deploy on **Vercel** — free, instant, gives you a live link for judges

### Pages/screens (keep it to these — don't over-scope)
1. **Home / Input screen** — the only screen that matters most
2. **Result screen** — verdict + confidence + explanation + source
3. **(Optional, if time allows) History/community screen** — shows past-checked claims, gives the "community validation" feature visual presence

### Low-literacy accessibility — concrete implementation choices, not just principles

| Principle | What to actually build |
|---|---|
| Icon-first, minimal text | Big pictographic buttons: a mic icon, a camera/upload icon, a "type" icon — user picks *how* they want to ask before they ask |
| Voice as primary input | A single large circular mic button, center of screen, above the fold. Everything else is secondary |
| No reading required to start | The mic button pulses/glows on load so it's obvious what to tap — don't make them read "Tap here to start" |
| Read-aloud output | Every verdict has a speaker icon that reads the result aloud (Web Speech API `speechSynthesis` for the prototype — free, built into browsers) |
| Large tap targets | Minimum 48px touch targets, generous spacing — this is a WCAG-adjacent rule, not optional |
| High contrast | Stick to the black/red/white palette already in your deck — it's naturally high-contrast |
| Regional language | Language picker as flags/scripts, not an English dropdown list — e.g. "हिंदी", "தமிழ்" shown in their own script, not "Hindi", "Tamil" in English |
| Confidence shown visually, not just numerically | Color-coded badge (green/yellow/red) + a simple face icon (✓ / ? / ✗) so a 0% literacy user still gets the gist |

### Component checklist
- [ ] `MicButton` — press to record, animated waveform while listening
- [ ] `LanguageSelector` — icon/script based, not text dropdown
- [ ] `InputCard` — accepts voice, text, or pasted forward
- [ ] `VerdictCard` — verdict, confidence badge, explanation, source link, "read aloud" button
- [ ] `LoadingState` — see animation section, this matters more than it sounds
- [ ] `FlagButton` — "report this as suspicious" — even if it just logs to a mock DB, shows the community feature

---

## 2. Backend

### Stack
- **FastAPI (Python)** — fast to write, plays well with AI/ML libraries, good for a hackathon
- **PostgreSQL** (or just SQLite for the prototype if time is short — don't over-engineer this)
- Deploy on **Render** or **Railway** — both have fast free-tier deploys

### Core API surface (keep it small)

```
POST /verify
  body: { text?: string, audio?: file, language: string }
  returns: { verdict, confidence, explanation, sources[], claim_id }

POST /flag
  body: { claim_id, user_note? }
  returns: { status }

GET /recent-claims
  returns: [{ claim_text, verdict, confidence, timestamp }]  # for the community/history screen
```

That's genuinely enough endpoints for a working demo. Resist the urge to build auth, user accounts, or admin dashboards — none of that helps the judges see the core idea working.

### What the backend actually does per request
1. Receives text (or transcribed voice)
2. Passes to the AI layer for verification (section 3)
3. Formats the response with confidence + sources
4. Logs the claim (for the "X people checked this" feature and for `/recent-claims`)
5. Returns JSON to frontend

### Data model (minimal)
```
claims table:
  id, text, language, verdict, confidence, explanation, sources (json), created_at, flag_count
```

One table is enough for a prototype.

---

## 3. AI Layer

This is the heart of the pitch, so it deserves the most care — but also the most realistic scoping, since "real-time RAG against live government portals" is not buildable in a hackathon. Fake the retrieval breadth, keep the reasoning real.

### Realistic hackathon approach
1. **Speech-to-text**: Use the browser's built-in Web Speech API for the prototype instead of standing up AI4Bharat's ASR — it's free, instant, and works in Chrome/Edge out of the box. Mention in the pitch that production would swap to AI4Bharat/Bhashini for better Indian-language accuracy and offline support.
2. **Translation** (if input isn't English): Any translation API you can get working fast — even Google Translate's API for the demo — with a note that production uses IndicTrans2.
3. **Retrieval**: Don't build a live web-scraping RAG pipeline in a weekend. Instead:
   - Pre-load a small curated dataset of 15–20 *known* misinformation claims and their actual verified status (real examples: fake PM scheme messages, fake KYC links, fake WhatsApp gold scheme forwards — these are well documented and easy to find)
   - When a query comes in, do a simple embedding similarity search against this dataset
   - If it matches something in the dataset closely → return that verdict with the real source
   - If it doesn't match anything → this is your **"unverifiable" honest-uncertainty state** — and this is actually a good demo moment, not a weakness, because it proves the system doesn't hallucinate
4. **Reasoning/explanation generation**: Use an LLM API (Claude or GPT) with a tightly constrained prompt: *"Given this claim and this retrieved evidence, write a 2-sentence plain-language explanation. If evidence is insufficient, say so explicitly — do not guess."*
5. **Confidence score**: Can be a simple function of embedding similarity score, not a "real" ML confidence — this is fine for a prototype, just be honest about it if judges ask.

### AI component checklist
- [ ] Curated dataset of ~15-20 misinformation examples with sources (this is your single highest-leverage task — spend real time on this)
- [ ] Embedding-based similarity search (sentence-transformers or an OpenAI/Claude embeddings call — either works)
- [ ] LLM call for explanation generation, with a strict prompt template
- [ ] Explicit "insufficient evidence" fallback path — wire this up deliberately, don't let it be an accident
- [ ] (Stretch goal, only if time remains) Basic image OCR for screenshot-forwarded claims

### Prompt template starting point
```
You are a fact-checking assistant for a low-literacy audience.
Given a CLAIM and RETRIEVED_EVIDENCE, respond in valid JSON:
{
  "verdict": "true" | "false" | "misleading" | "unverifiable",
  "confidence": 0-100,
  "explanation": "<2 short sentences, plain language, no jargon>",
  "source": "<name of source, or null if unverifiable>"
}
Rules:
- If RETRIEVED_EVIDENCE does not clearly support or refute the claim, verdict MUST be "unverifiable" and confidence MUST be under 40.
- Never state something as true or false without evidence backing it.
- Explanation must be understandable to someone with no formal education.
```

---

## 4. Animation Plan

Animation should support the low-literacy goal — motion that guides attention and confirms actions — not decoration for its own sake. Keep it purposeful and light so it doesn't hurt load time on low bandwidth.

| Where | What | Why |
|---|---|---|
| Mic button, idle state | Gentle pulse/glow loop | Draws the eye without needing to read "tap here" |
| Mic button, while listening | Animated waveform bars reacting to voice input | Confirms the system is actually hearing them — critical trust signal for voice-first UX |
| On submit | Brief "thinking" animation (e.g. a scanning/searching motion, not a generic spinner) | Communicates "checking against sources" even to someone who can't read the loading text |
| Verdict reveal | Card slides/fades in, confidence badge fills in like a gauge | Makes the result feel earned rather than instant/suspicious |
| Verdict color | Badge color transitions (grey → red/yellow/green) as confidence resolves | Reinforces the result non-verbally |
| Language switch | Smooth crossfade of UI text, not a jarring reload | Feels polished, avoids disorientation |
| Flag/report button | Small satisfying tap-confirm animation (checkmark bounce) | Confirms the action landed — important since there's often no other feedback |

**Tooling**: Framer Motion covers all of the above without much overhead. Keep animations under ~300ms for anything in the interaction path (mic press, submit) so the app still feels fast on low-end phones — this directly matters for your low-bandwidth constraint, not just aesthetics.

---

## 5. Suggested build order (if the team is splitting work)

1. **Backend skeleton + `/verify` endpoint returning mock data** — unblocks frontend immediately
2. **Frontend input + result screens wired to the mock endpoint** — gets a clickable demo working fast
3. **AI layer**: curated dataset + embedding search + LLM explanation — swap into the real endpoint
4. **Animation pass** — once the core flow works, layer in motion
5. **Polish**: language selector, flag button, recent-claims screen, read-aloud

Steps 1–2 in parallel across two team members, step 3 by whoever's strongest with Python/AI, step 4–5 once the core loop works end to end.
