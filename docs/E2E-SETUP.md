# What is still needed to make AI Scam Shield work end-to-end

**Status as of the last health check (`GET /api/health`):**

```json
"status": "setup_required",
"integrations": { "llm": false, "huggingface": false, "safeBrowsing": false },
"auth": { "authSecretConfigured": true }
```

Everything that can be built has been built. The app runs, authentication works, uploads validate,
FFmpeg is installed, and all routes render. **The only thing missing is external AI credentials.**
Until they are supplied, each detector deliberately returns *"Detector setup required"* rather than
inventing a verdict.

---

## 1. Blocking items (required for E2E)

| # | What | Status | Why it blocks | Where to get it | Cost |
|---|---|---|---|---|---|
| 1 | `LLM_API_KEY` | ❌ Empty | Message Detector cannot classify without a model | OpenAI / **Groq (free)** / OpenRouter | Free tier available |
| 2 | `HF_API_TOKEN` | ❌ Empty | Photo **and** Video detectors call Hugging Face Inference | https://huggingface.co/settings/tokens | Free tier available |
| 3 | `AUTH_SECRET` | ✅ **Done** | Sessions are now signed with a real random secret | Already generated locally | Free |

**Two items remain.** Neither can be generated on this machine — they are account credentials
minted by the provider and bound to your identity and quota. See
[API-KEYS-GUIDE.md](API-KEYS-GUIDE.md#01-current-status--which-keys-exist-and-which-cannot-be-auto-generated)
for why, and for click-by-click signup steps.

Nothing else is blocking. There is no database to provision, no external service to deploy, and
FFmpeg is already bundled (`ffmpeg-static` installed `ffmpeg.exe`, confirmed by the health check:
`"ffmpeg": true`).

---

## 2. Step-by-step completion guide

### Step 1 — Generate an auth secret ✅ already done

> This step is complete. The secret was generated with `crypto.randomBytes(32)` and written to
> `.env.local`; `GET /api/health` now reports `"authSecretConfigured": true`. Keep the command
> below for rotating the secret later.

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output into `.env.local` as `AUTH_SECRET=...`.

> Without this, sessions still work, but they are signed with a public constant. Anyone who reads
> the source could forge a session cookie. Fine for a laptop demo, not fine if you expose the port.

### Step 2 — Get an LLM key (Message Detector)

**Recommended for a hackathon: Groq.** It is free, fast, and OpenAI-compatible.

1. Sign up at https://console.groq.com and create an API key.
2. In `.env.local`:

```ini
LLM_API_KEY=gsk_your_key_here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

Alternatives (pick one, not all):

| Provider | `LLM_BASE_URL` | `LLM_MODEL` |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| OpenRouter | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct` |

> The code requires a provider that supports `response_format: { type: "json_object" }`. All three
> above do. If you choose a provider that does not, the classifier will still work because the
> response is defensively parsed, but reliability drops.

### Step 3 — Get a Hugging Face token (Photo + Video Detectors)

1. Create a **read** token at https://huggingface.co/settings/tokens.
2. In `.env.local`:

```ini
HF_API_TOKEN=hf_your_token_here
```

The default models are already set and need no change:

| Task | Model |
|---|---|
| AI-generated image detection | `Organika/sdxl-detector` |
| Deepfake / face manipulation (also used per video frame) | `prithivMLmods/Deep-Fake-Detector-Model` |

**Important caveat:** Hugging Face's serverless Inference API does not host every model
permanently. If a model returns `404` or stays at `503` after the built-in retries, it is not
currently served. Two ways to fix it:

- Switch to another served classifier by changing `HF_AIGEN_IMAGE_MODEL` / `HF_DEEPFAKE_IMAGE_MODEL`.
  The code auto-maps labels, so any model whose labels look like `real/fake`, `human/artificial`,
  `authentic/deepfake` will work with no code change.
- Or deploy the model yourself (HF Inference Endpoint, Replicate, or your own FastAPI server) and
  point `HF_BASE_URL` at it, as long as it accepts raw image bytes and returns
  `[{ "label": "...", "score": 0.0 }]`.

### Step 4 — Optional: link reputation

```ini
SAFE_BROWSING_API_KEY=your_google_api_key
```

Get it by enabling the **Safe Browsing API** in a Google Cloud project
(https://developers.google.com/safe-browsing). Without it the Message Detector still extracts and
structurally analyses URLs, and applies a risk floor of 40 because the links could not be verified.

### Step 5 — Restart and verify

Environment variables are read at server start, so a restart is mandatory.

```powershell
# Ctrl+C the running dev server, then:
npm run dev
```

---

## 3. Verification checklist

Run these in order. All four must pass for a true E2E demo.

### 3.1 Health

```powershell
(Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing).Content
```

**Expected:** `"status": "ok"`, all three detectors `"ready": true`, and
`"authSecretConfigured": true`.

### 3.2 Auth

1. Open http://localhost:3000/message-detector while signed out → must redirect to
   `/login?next=/message-detector`.
2. Create an account or sign in → must land back on the message detector.
3. Confirm the navbar shows your name and a **Sign out** button.

### 3.3 Message Detector

Use the built-in sample buttons on the page:

| Sample | Expected outcome |
|---|---|
| **Bank KYC phishing** | High risk. Indicators include OTP request, account suspension threat, suspicious `.top` domain. |
| **Fake job offer** | High or Medium risk. Indicators include payment/fee demand, fake job offer, off-platform contact push. |
| **Ordinary message** | Low risk, with an explicit note that this does not prove the message is genuine. |

The result must show a risk badge, a score meter, a confidence percentage, a list of indicators,
recommended actions, and the "Detection engines used" panel listing the LLM, the rule engine and
Safe Browsing.

### 3.4 Photo Detector

Upload a JPG/PNG/WEBP under 8 MB. Test both:

- A real camera photo → expect a low manipulation percentage.
- An image from an AI generator (Midjourney/DALL·E/SDXL output) → expect a high percentage on the
  **AI-generated image detection** card.

Both model cards must display label distributions. If one card says *Unavailable*, read its error
message — it will name the model and the HTTP status.

### 3.5 Video Detector

Upload an MP4 or MOV, **under 50 MB and under 60 seconds**. Expect a frame timeline chart, frames
analysed count, and a suspicious-timestamps list. First run may be slow while the model warms up.

---

## 4. Known gaps and deliberate limitations

These are not bugs. They are documented trade-offs for a hackathon build.

| Area | Current state | Production fix |
|---|---|---|
| **User store** | JSON file at `.data/users.json`, read-modify-write | Postgres/SQLite with proper transactions |
| **Auth features** | Sign in / sign up / sign out only | Email verification, password reset, refresh-token rotation, MFA |
| **Rate limiting** | In-memory `Map`, per process | Redis / Upstash so limits hold across instances |
| **Video on serverless** | FFmpeg + large binary will hit Vercel's execution limits | Deploy to a container (Railway, Render, Fly.io, VPS) |
| **Model warm-up** | First HF call can take 20–60s while the model loads | Dedicated HF Inference Endpoint or self-hosted model |
| **Scan history** | Browser `localStorage` only, opt-in | Server-side history behind the existing auth, with encryption at rest |
| **Contact form** | `mailto:` submission | Real mail API (Resend, SendGrid) via a server route |
| **Detector coverage** | Text, image, video | Audio/voice-clone detection for vishing scams |
| **Abuse control** | Per-IP rate limit | Per-account quotas, now that accounts exist |

---

## 5. Cost and time estimate to finish

| Task | Effort | Cost |
|---|---|---|
| ~~Generate `AUTH_SECRET`~~ | ✅ Done | Free |
| Groq account + key | Short signup | Free tier |
| Hugging Face token | Short signup | Free tier |
| Safe Browsing key (optional) | Google Cloud project setup | Free quota |
| Verify all three detectors | Walk through section 3 | Free |

Once the two remaining keys in section 1 are in `.env.local` and the server is restarted, the
application is fully functional end-to-end with no further code changes.

---

## 6. Quick reference — final `.env.local`

```ini
# Message Detector
LLM_API_KEY=gsk_...
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile

# Photo + Video Detectors
HF_API_TOKEN=hf_...
HF_BASE_URL=https://api-inference.huggingface.co/models
HF_AIGEN_IMAGE_MODEL=Organika/sdxl-detector
HF_DEEPFAKE_IMAGE_MODEL=prithivMLmods/Deep-Fake-Detector-Model

# Optional link reputation
SAFE_BROWSING_API_KEY=

# Authentication (already generated)
AUTH_SECRET=<64-char hex, already present in .env.local>

# Limits
MAX_IMAGE_MB=8
MAX_VIDEO_MB=50
MAX_VIDEO_SECONDS=60
VIDEO_FRAME_COUNT=8
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX_REQUESTS=12
```
