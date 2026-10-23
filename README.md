# AI Scam Shield

**Detect Scams. Verify Media. Stay Protected.**

A full-stack AI cybersecurity app that helps people check three things they receive from strangers:

| Detector | What it does | Real backend |
|---|---|---|
| **Scam Message Detector** | Classifies SMS / WhatsApp / email / job offers for phishing and social-engineering risk | OpenAI-compatible LLM + deterministic rule engine + Google Safe Browsing |
| **AI Photo Detector** | Separately checks for *fully AI-generated* images and for *face-swap / manipulation* artefacts | Hugging Face Inference (2 image-classification models) |
| **Deepfake Video Detector** | Extracts frames with FFmpeg, scores each one, returns suspicious timestamps | FFmpeg + Hugging Face Inference |

> No result in this app is simulated. If a provider key is missing, the detector returns
> **“Detector setup required”** and tells you exactly what to connect.

> **Not working end-to-end yet?** See [docs/E2E-SETUP.md](docs/E2E-SETUP.md) for the exact list of
> credentials still required, a verification checklist, and known limitations.

> **Need the keys?** [docs/API-KEYS-GUIDE.md](docs/API-KEYS-GUIDE.md) walks through generating every
> API key provider-by-provider, shows the single file you edit, and documents where response
> handling is already implemented (no code changes needed).

---

## 1. Tech stack

- **Next.js 14 (App Router)** + **React 18** + **TypeScript**
- **Tailwind CSS** — dark navy / electric blue / cyan, glass cards, responsive, accessible
- **Next.js Route Handlers** (Node.js runtime) for all server-side AI calls
- **ffmpeg-static** for server-side video frame extraction

---

## 2. Quick start

```bash
cd ai-scam-shield
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# edit .env.local and add your keys
npm run dev
```

Open http://localhost:3000 and check http://localhost:3000/api/health.

---

## 3. Environment variables

All keys are **server-side only** — they are never sent to the browser.

### Required for the Message Detector

| Variable | Description |
|---|---|
| `LLM_API_KEY` | API key for any OpenAI-compatible chat-completions endpoint |
| `LLM_BASE_URL` | Default `https://api.openai.com/v1` |
| `LLM_MODEL` | Default `gpt-4o-mini` |

Working combinations:

| Provider | `LLM_BASE_URL` | `LLM_MODEL` |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Groq (free tier) | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| OpenRouter | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct` |

### Required for the Photo & Video Detectors

| Variable | Description |
|---|---|
| `HF_API_TOKEN` | Hugging Face token (read scope) — https://huggingface.co/settings/tokens |
| `HF_AIGEN_IMAGE_MODEL` | Default `Organika/sdxl-detector` |
| `HF_DEEPFAKE_IMAGE_MODEL` | Default `prithivMLmods/Deep-Fake-Detector-Model` |
| `HF_BASE_URL` | Default `https://api-inference.huggingface.co/models` |

### Optional

| Variable | Description |
|---|---|
| `SAFE_BROWSING_API_KEY` | Google Safe Browsing v4 key for link reputation |
| `MAX_IMAGE_MB` | Default `8` |
| `MAX_VIDEO_MB` | Default `50` |
| `MAX_VIDEO_SECONDS` | Default `60` |
| `VIDEO_FRAME_COUNT` | Default `8` frames sampled per video |
| `RATE_LIMIT_WINDOW_SECONDS` / `RATE_LIMIT_MAX_REQUESTS` | Default `60` / `12` per IP |
| `AUTH_SECRET` | Secret used to sign session cookies. Falls back to an insecure dev secret if unset. |
| `FFMPEG_PATH` | Override if `ffmpeg-static` cannot ship a binary for your platform |

Generate an auth secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Authentication (local)

All three detectors are behind a login. Auth runs entirely on this machine — no external identity
provider, no database server.

- **User store:** `.data/users.json` (git-ignored, created on first signup)
- **Password hashing:** Node `scrypt` with a per-user 16-byte random salt, verified with `timingSafeEqual`
- **Session:** HMAC-SHA256 signed token in an **HttpOnly**, `SameSite=Lax` cookie (`Secure` in production), 7-day expiry
- **Route protection:** `middleware.ts` verifies the signature on the edge before the page or API route runs
- **Account enumeration:** login failures always return the same vague message, and a derivation runs even for unknown emails so timing does not leak existence
- **Brute force:** login and signup are rate limited per IP, same as the analysis endpoints

| Behaviour | Result |
|---|---|
| Visiting `/message-detector` logged out | Redirect to `/login?next=/message-detector` |
| Calling `/api/analyze/*` logged out | `401 { "code": "unauthorized" }` |
| After sign in | Redirected back to the page you originally requested |

> This is deliberately simple hackathon-grade auth. For production, swap the JSON store for a real
> database and add email verification, password reset and refresh-token rotation.

---

## 5. API reference

| Endpoint | Method | Body | Returns |
|---|---|---|---|
| `/api/health` | GET | — | Per-detector readiness, configured models, limits, auth status |
| `/api/auth/signup` | POST | `{ "email", "password", "name" }` | Creates the account and sets the session cookie |
| `/api/auth/login` | POST | `{ "email", "password" }` | Sets the session cookie |
| `/api/auth/logout` | POST | — | Clears the session cookie |
| `/api/auth/me` | GET | — | `{ "user": PublicUser \| null }` |
| `/api/analyze/message` | POST | `application/json` → `{ "message": "..." }` | `MessageAnalysis` *(auth required)* |
| `/api/analyze/photo` | POST | `multipart/form-data` → `file` | `PhotoAnalysis` *(auth required)* |
| `/api/analyze/video` | POST | `multipart/form-data` → `file` | `VideoAnalysis` *(auth required)* |

Error shape:

```json
{ "error": "human readable message", "code": "setup_required", "setup": ["..."] }
```

`code` is one of `setup_required`, `invalid_input`, `too_large`, `rate_limited`, `unauthorized`, `upstream_failed`, `timeout`, `server_error`.

### Test the three workflows

```bash
# health
curl http://localhost:3000/api/health

# message
curl -X POST http://localhost:3000/api/analyze/message ^
  -H "content-type: application/json" ^
  -d "{\"message\":\"Dear Customer, your account will be BLOCKED today. Update KYC at http://sbi-kyc-verify.top and share the OTP.\"}"

# photo
curl -X POST http://localhost:3000/api/analyze/photo -F "file=@sample.jpg"

# video
curl -X POST http://localhost:3000/api/analyze/video -F "file=@sample.mp4"
```

The Message Detector page also ships three one-click sample inputs (bank phishing, fake job
offer, and an ordinary message) so you can demo all three risk levels quickly.

---

## 6. Security measures implemented

- Local authentication gate on every detector page and analysis endpoint (scrypt hashing, signed HttpOnly cookie)
- API keys only in server environment variables; zero credentials in client bundles
- Per-IP fixed-window rate limiting on every analysis endpoint
- Upload size limits enforced server-side **and** magic-byte sniffing (client MIME is not trusted)
- Video duration limit enforced via FFmpeg probe before any inference runs
- Temp frame directories removed in a `finally` block
- Links in results are rendered as plain text, never as clickable anchors
- Safe error handling — upstream failures never leak keys or stack traces
- No content persistence; history is opt-in and browser-local only

---

## 7. Detection methodology (and why it is honest)

- **Message:** the LLM verdict is weighted 70%, the rule engine 30%, and the score can only be
  *raised* by link findings. If links exist but cannot be reputation-checked, a risk floor of 40 is
  applied — a message is never called "safe" just because no keyword matched.
- **Photo:** the two models are reported separately with their own label distributions; the overall
  score takes the higher of the two mapped probabilities.
- **Video:** aggregation uses `0.45 × mean + 0.55 × top-30% mean` so manipulation in a few frames is
  not diluted by clean frames. Frames at or above 60% are listed as suspicious timestamps.
- Every result carries an explicit disclaimer. The app never claims certainty in either direction.

---

## 8. Deployment

### Vercel (fastest)

1. Push this folder to a Git repo and import it in Vercel.
2. Add every variable from `.env.example` in **Project → Settings → Environment Variables**.
3. Deploy.

> **Video caveat:** Vercel serverless functions have execution-time and bundle limits, and
> `ffmpeg-static` ships a large binary. For reliable video analysis, deploy to a container
> (Railway, Render, Fly.io, a VPS, or `next start` behind Nginx) where FFmpeg can run without
> a hard timeout. Message and photo detection work fine on serverless.

### Docker / VPS

```bash
npm ci
npm run build
npm run start   # listens on :3000
```

---

## 9. External services still required

To go from "running" to "fully functional", you must supply:

1. **An LLM API key** (OpenAI / Groq / OpenRouter) → message detector.
2. **A Hugging Face token** → photo and video detectors.
3. *(Optional)* **A Google Safe Browsing API key** → link reputation checks.

Without these, the UI runs and clearly shows **Detector setup required** per detector —
by design, it will not invent a verdict.

### Possible upgrades

- Swap Hugging Face for a self-hosted model server (FastAPI + ONNX / Torch) for lower latency.
- Add Redis / Upstash rate limiting for multi-instance deployments.
- Add VirusTotal or urlscan.io alongside Safe Browsing for richer link intelligence.
- Add audio deepfake detection for voice-call scams.

---

## 10. Project structure

```
app/
  api/health/route.ts            # backend health-check + setup report
  api/auth/{signup,login,logout,me}/route.ts
  api/analyze/message/route.ts   # LLM + rules + Safe Browsing
  api/analyze/photo/route.ts     # 2 HF image models
  api/analyze/video/route.ts     # FFmpeg frames + HF deepfake model
  page.tsx                       # home dashboard + contact/feedback
  login                          # sign in / create account
  message-detector | photo-detector | video-detector
  safety-tips | about | privacy | terms
middleware.ts                    # session gate for detectors and analyze APIs
components/                      # reusable UI + the three detector clients
lib/
  config.ts  rate-limit.ts  api.ts  types.ts
  session.ts  users.ts
  llm.ts  message-heuristics.ts  urls.ts  analyze-message.ts
  huggingface.ts  analyze-photo.ts
  video.ts  analyze-video.ts
```
