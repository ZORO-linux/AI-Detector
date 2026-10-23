# How to generate the API keys — and exactly where to put them

> **Read this first:** You do **not** need to edit a single line of TypeScript.
> Every key is read from environment variables. The only file you edit is **`.env.local`**.
> All request building, retries, error handling and response parsing is **already implemented**.
> Section 4 shows you exactly where, with file and line references, so you can verify it yourself.

---

## 0. The one file you edit

```
ai-scam-shield/.env.local
```

If it does not exist yet:

```powershell
cd "c:\Local\AI Learning\ai-scam-shield"
Copy-Item .env.example .env.local
```

This file is git-ignored. It never reaches the browser. Restart the dev server after every change —
environment variables are read once at startup.

---

## 0.1 Current status — which keys exist, and which cannot be auto-generated

| Variable | Status | Can it be generated locally? |
|---|---|---|
| `AUTH_SECRET` | ✅ **Already generated and written to `.env.local`** | **Yes** — it is just random bytes |
| `LLM_API_KEY` | ❌ Empty | **No** — must be minted by Groq / OpenAI / OpenRouter |
| `HF_API_TOKEN` | ❌ Empty | **No** — must be minted by Hugging Face |
| `SAFE_BROWSING_API_KEY` | ❌ Empty (optional) | **No** — must be minted by Google Cloud |

### Why only `AUTH_SECRET` could be generated

`AUTH_SECRET` is a **local secret**. Nothing outside this machine needs to recognise it — it only
signs and verifies our own session cookies. So any 32 cryptographically random bytes will do:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This has already been run and the result written into `.env.local`. Verified live:

```json
"auth": { "authSecretConfigured": true }
```

### Why the other three cannot be generated

The remaining three are **account credentials**, not random strings. The provider mints them on
their own servers and permanently binds them to:

- your **identity** (verified email / GitHub account),
- your **usage quota and billing**,
- a **revocation record**, so they can disable the key later.

There is no algorithm that produces a valid one. A locally invented string would simply be rejected
with `401 Unauthorized` on the first request. This is a deliberate property of how API
authentication works, not a limitation of this project or of any tool.

> **Security note:** be sceptical of anything claiming to "generate" an OpenAI or Hugging Face key
> for you. Such a key is either fabricated (and will fail immediately) or belongs to someone else.

### What this means in practice

Each of the three takes a couple of minutes of signup, and the two you actually need are **free**:

| Key | Signup | Free tier | Card required |
|---|---|---|---|
| Groq (`LLM_API_KEY`) | GitHub login | Yes | No |
| Hugging Face (`HF_API_TOKEN`) | Email | Yes | No |
| Google Safe Browsing (optional) | Google Cloud project | Yes, quota-limited | Yes, for the project |

Sections 1–3 below are the click-by-click instructions for each.

---

## 1. `LLM_API_KEY` — Scam Message Detector

### Option A — Groq (recommended for a hackathon: free and fast)

1. Go to **https://console.groq.com** and sign up (GitHub/Google login works).
2. Open **API Keys** in the left sidebar.
3. Click **Create API Key**, give it a name such as `ai-scam-shield`.
4. Copy the key immediately — it is shown only once. It starts with `gsk_`.

Paste into `.env.local`:

```ini
LLM_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
```

### Option B — OpenAI

1. Go to **https://platform.openai.com/api-keys**.
2. Click **Create new secret key**. Key starts with `sk-`.
3. Add billing credit — OpenAI has no free tier for API use.

```ini
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

### Option C — OpenRouter

1. Go to **https://openrouter.ai/keys** and sign in.
2. Click **Create Key**. Key starts with `sk-or-v1-`.

```ini
LLM_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=meta-llama/llama-3.3-70b-instruct
```

### Where this key is consumed

| What | Location |
|---|---|
| Read from the environment | [lib/config.ts](../lib/config.ts#L8) — `apiKey: process.env.LLM_API_KEY ?? ''` |
| "Is it configured?" check | [lib/config.ts](../lib/config.ts#L37) — `isLlmConfigured()` |
| Sent as a Bearer header | [lib/llm.ts](../lib/llm.ts#L59) — inside `classifyMessageWithLlm` |

You never touch these files. They already read whatever you put in `.env.local`.

---

## 2. `HF_API_TOKEN` — Photo and Video Detectors

1. Go to **https://huggingface.co/settings/tokens** (create a free account first).
2. Click **Create new token**.
3. Choose token type **Read**. Name it `ai-scam-shield`.
4. Click **Create token** and copy it. It starts with `hf_`.

```ini
HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The model names already have working defaults, so leave them unless a model stops being served:

```ini
HF_BASE_URL=https://api-inference.huggingface.co/models
HF_AIGEN_IMAGE_MODEL=Organika/sdxl-detector
HF_DEEPFAKE_IMAGE_MODEL=prithivMLmods/Deep-Fake-Detector-Model
```

### Where this token is consumed

| What | Location |
|---|---|
| Read from the environment | [lib/config.ts](../lib/config.ts#L17) — `token: process.env.HF_API_TOKEN ?? ''` |
| "Is it configured?" check | [lib/config.ts](../lib/config.ts#L38) — `isHfConfigured()` |
| Sent as a Bearer header | [lib/huggingface.ts](../lib/huggingface.ts#L52) — inside `classifyImage` |

### If a model is not available

Hugging Face's free serverless API does not host every model permanently. If you see a 404 or a
persistent 503, change only the model name in `.env.local` — **no code change is needed**, because
the label mapper auto-detects real/fake vocabularies:

[lib/huggingface.ts](../lib/huggingface.ts#L15) — `classifyLabelSide()` matches labels such as
`fake`, `deepfake`, `artificial`, `synthetic`, `manipulated`, `ai-generated` against
`real`, `human`, `realism`, `authentic`, `genuine`.

So any image classifier with that style of label set drops in cleanly.

---

## 3. `SAFE_BROWSING_API_KEY` — link reputation (optional)

1. Go to **https://console.cloud.google.com** and create a project.
2. Open **APIs & Services → Library**, search for **Safe Browsing API**, click **Enable**.
3. Open **APIs & Services → Credentials → Create Credentials → API key**.
4. Copy the key and restrict it to the Safe Browsing API.

```ini
SAFE_BROWSING_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
```

| What | Location |
|---|---|
| Read from the environment | [lib/config.ts](../lib/config.ts#L13) |
| Used in the lookup call | [lib/urls.ts](../lib/urls.ts#L91) — `safeBrowsingLookup()` |

Skip this and the app still extracts and structurally analyses every URL — it just marks them
`Not reputation-checked` and applies a risk floor.

---

## 4. `AUTH_SECRET` — session signing

> ✅ **This one is already done.** It was generated with `crypto.randomBytes(32)` and written into
> `.env.local`, and the health endpoint confirms `"authSecretConfigured": true`. The steps below are
> only needed if you want to **rotate** it (for example before deploying, or if the file leaks).

No website to visit. Generate it locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```ini
AUTH_SECRET=<paste the 64-character hex string>
```

Or regenerate and write it in one step, without ever printing the value to the screen:

```powershell
$secret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
(Get-Content .env.local) -replace '^AUTH_SECRET=.*', "AUTH_SECRET=$secret" | Set-Content .env.local -Encoding UTF8
```

Rotating the secret invalidates every existing session cookie, so all users are signed out. That is
expected and safe — accounts in `.data/users.json` are untouched.

| What | Location |
|---|---|
| Read + dev fallback | [lib/session.ts](../lib/session.ts#L15) — `secret()` |
| Reported in health check | [lib/session.ts](../lib/session.ts#L19) — `usingDevSecret()` |

---

## 5. Response handling is already implemented — here is the proof

This is the part you asked me to make clear. **You do not write any request, parsing, retry or
error-handling code.** It is all in the repo already. Verify each claim at the line referenced.

### 5.1 Missing key → friendly setup screen, never a crash

Each detector checks configuration *before* doing any work and returns a structured
`setup_required` response with the exact variables to set:

| Detector | Guard |
|---|---|
| Message | [app/api/analyze/message/route.ts](../app/api/analyze/message/route.ts#L14) |
| Photo | [app/api/analyze/photo/route.ts](../app/api/analyze/photo/route.ts#L31) |
| Video | [app/api/analyze/video/route.ts](../app/api/analyze/video/route.ts#L28) |

The hint text comes from [lib/config.ts](../lib/config.ts#L41) — `setupHints()`.
The UI renders it as the blue "Detector setup required" card in
[components/ResultCommon.tsx](../components/ResultCommon.tsx#L80).

### 5.2 LLM response parsing

| Concern | Handled at |
|---|---|
| Non-200 from provider | [lib/llm.ts](../lib/llm.ts#L77) — throws with the provider's status and body excerpt |
| Empty response | [lib/llm.ts](../lib/llm.ts#L88) |
| Model wraps JSON in markdown fences | [lib/llm.ts](../lib/llm.ts#L40) — `parseJson()` strips ```` ``` ```` fences, then falls back to slicing between the first `{` and last `}` |
| Missing or out-of-range fields | [lib/llm.ts](../lib/llm.ts#L35) — `clamp()`, plus defaults for every field |
| Bad `risk` value | Defaults to `medium`, never silently to `low` |
| Request hangs | 45-second `AbortSignal.timeout` on the fetch |

### 5.3 Hugging Face response parsing

| Concern | Handled at |
|---|---|
| Model cold-start (HTTP 503) | [lib/huggingface.ts](../lib/huggingface.ts#L73) — up to 3 attempts with backoff and `x-wait-for-model` |
| Non-200 | [lib/huggingface.ts](../lib/huggingface.ts#L78) — typed `HfError` carrying the status |
| Nested array response shape | Flattened automatically before parsing |
| Unknown label vocabulary | [lib/huggingface.ts](../lib/huggingface.ts#L26) — returns `null` instead of guessing |
| One of two photo models fails | [lib/analyze-photo.ts](../lib/analyze-photo.ts#L48) — that model is marked `available: false` and excluded; the other still produces a verdict |
| Both photo models fail | [lib/analyze-photo.ts](../lib/analyze-photo.ts#L75) — clear error naming each model |
| Individual video frames fail | [lib/analyze-video.ts](../lib/analyze-video.ts#L54) — skipped, remaining frames still scored |
| All video frames fail | [lib/analyze-video.ts](../lib/analyze-video.ts#L60) — explicit error, no fabricated score |

### 5.4 Safe Browsing

Non-200 or a network failure is caught in [lib/urls.ts](../lib/urls.ts#L114) and degrades
gracefully: the engine is reported as unavailable and the message still gets a verdict.

### 5.5 Transport-level errors

| Concern | Handled at |
|---|---|
| Timeouts mapped to HTTP 504 | [lib/api.ts](../lib/api.ts#L26) — `describeUpstreamError()` |
| Rate limiting | [lib/api.ts](../lib/api.ts#L14) — returns 429 with a `Retry-After` header |
| Upload network error / timeout / non-JSON body | [components/upload.ts](../components/upload.ts#L34) |
| Expired session during a scan | [components/ResultCommon.tsx](../components/ResultCommon.tsx#L94) — "Session expired" with a sign-in link |
| Every other error code | [components/ResultCommon.tsx](../components/ResultCommon.tsx#L105) — mapped to a human-readable title |

### 5.6 What is deliberately *not* handled by faking it

If a real detector does not return a result, the app returns an error. It never substitutes a
random or hardcoded score. That is why you currently see "Detector setup required" instead of a
fake verdict.

---

## 6. Final steps

1. Save `.env.local`.
2. Check which credentials are set, without printing their values:

   ```powershell
   Get-Content .env.local | Select-String -Pattern '^(AUTH_SECRET|LLM_API_KEY|HF_API_TOKEN|SAFE_BROWSING_API_KEY)=' | ForEach-Object {
     $parts = $_.Line -split '=', 2
     "{0} = {1}" -f $parts[0], $(if ($parts[1].Length -gt 0) { "SET ($($parts[1].Length) chars)" } else { "EMPTY" })
   }
   ```

3. Restart the server:

   ```powershell
   # Ctrl+C in the running terminal, then
   npm run dev
   ```

4. Confirm every detector is live:

   ```powershell
   (Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing).Content
   ```

   You want `"status": "ok"` and `"ready": true` for message, photo and video.

5. Open http://localhost:3000/message-detector, sign in, click **Try: Bank KYC phishing**, then
   **Analyze Message**. A real risk verdict should appear.

---

## 7. Security reminders

- **Never** paste a key into a `.tsx` or `.ts` file. Every key belongs in `.env.local`.
- Only variables prefixed `NEXT_PUBLIC_` reach the browser. **None of these keys use that prefix**,
  which is why they stay server-side.
- `.env.local` and `.data/` are already in [.gitignore](../.gitignore).
- If a key leaks, revoke it in the provider dashboard and generate a new one — rotating is just an
  edit to `.env.local` plus a restart.
