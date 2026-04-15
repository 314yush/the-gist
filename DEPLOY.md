# Deployment Guide — The Gist

> **GitHub:** https://github.com/314yush/the-gist.git

**Production split:** **API** on [Railway](https://railway.app) (Docker). **Landing / frontend** on [Vercel](https://vercel.com) (static Vite build).

| Unit | Where | Type |
|------|-------|------|
| **API** (`apps/api`) | Railway | Docker (`apps/api/Dockerfile`) |
| **Landing** (`apps/landing`) | Vercel | Static site (`pnpm vercel-build:landing`) |
| **Extension** (`apps/extension`) | Chrome Web Store | Manual zip upload |

The files `apps/landing/Dockerfile` and `apps/landing/railway.toml` are optional if you ever want the landing on Railway instead; the default setup is Vercel for the frontend.

---

## Prerequisites

- GitHub account
- Railway account — connect it to your GitHub repo
- Vercel account — import the same GitHub repo
- Chrome Web Store Developer account ($5 one-time: https://chrome.google.com/webstore/devconsole)
- API keys ready: `OPENROUTER_API_KEY`, `XAI_API_KEY`, `AUTH_SECRET`

---

## Step 0: Push to GitHub

```bash
cd /path/to/the-gist

git init
git branch -M main
git add .
git commit -m "Initial commit"

git remote add origin https://github.com/314yush/the-gist.git
git push -u origin main
```

Or with GitHub CLI: `gh repo create the-gist --private --source=. --remote=origin --push`

---

## Step 1: Deploy API on Railway

### 1.1 Create the service

1. https://railway.app/dashboard → **New Project** → **Deploy from GitHub Repo**
2. Select **the-gist** (`314yush/the-gist`)
3. **Config file path** (service **Settings**): `apps/api/railway.toml`  
   Dockerfile path in that file: `apps/api/Dockerfile`

### 1.2 Environment variables

Railway → your API service → **Variables**:

```
NODE_ENV=production
PORT=3000
OPENROUTER_API_KEY=sk-or-v1-your-key
XAI_API_KEY=xai-your-key
AUTH_SECRET=<run: openssl rand -base64 32>
RATE_LIMIT_RPM=60
CORS_ORIGINS=https://thegist.app
```

Add your **Vercel production URL** to `CORS_ORIGINS` (comma-separated) once you have it, e.g.:

```
CORS_ORIGINS=https://thegist.app,https://the-gist.vercel.app
```

For preview deploys, either add each `*.vercel.app` preview URL while testing or use a stable preview branch domain in Vercel.

Optional:

```
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_IMAGE_MODEL=google/gemini-2.5-flash-image-preview
EXTENSION_ID=<chrome-extension-id-once-published>
INVITE_CODE=<if-invite-gating>
```

### 1.3 Domain

**Settings** → **Networking** → **Generate Domain** (e.g. `thegist-api-production.up.railway.app`). Use this URL in the extension default API URL and anywhere else that calls the API.

### 1.4 Verify

```bash
curl https://YOUR-RAILWAY-API-DOMAIN/health
# {"status":"ok"}
```

---

## Step 2: Deploy landing on Vercel

### 2.1 Create the project

1. [Vercel](https://vercel.com) → **Add New** → **Project** → import **314yush/the-gist**
2. **Root Directory:** `apps/landing` (important for the monorepo)
3. Vercel reads `apps/landing/vercel.json` (`installCommand`, `buildCommand`, Vite output `dist`)

### 2.2 Environment variables (optional)

In **Settings** → **Environment Variables**, add anything referenced as `VITE_*` in the app. Example from `apps/landing/.env.example`:

```
VITE_CHROME_STORE_URL=https://chrome.google.com/webstore/detail/the-gist/your-id
```

Redeploy after changing env vars.

### 2.3 Domain

Assign **thegist.app** (or a subdomain) under **Project** → **Settings** → **Domains**, or use the default `*.vercel.app` URL.

### 2.4 Align CORS on the API

Copy your **production** Vercel URL into Railway’s `CORS_ORIGINS` so the browser can call the Railway API from the marketing site (see Step 1.2).

---

## Step 3: Point extension at production API

Edit `apps/extension/src/lib/api.ts`: set the default API URL to your Railway API (not Vercel):

```typescript
return (await getLocal('apiUrl')) || 'https://YOUR-RAILWAY-API-DOMAIN';
```

Build and zip:

```bash
pnpm --filter @thegist/extension build
cd apps/extension/dist && zip -r ../thegist-extension.zip .
```

---

## Step 4: Chrome Web Store

Same store listing and privacy steps as before — upload `apps/extension/thegist-extension.zip`. After approval, set `EXTENSION_ID` on the Railway API and refresh `CORS_ORIGINS` / extension origins as in **Step 5** below.

---

## Step 5: CORS and extension ID (production)

Railway API variables:

```
CORS_ORIGINS=https://thegist.app,https://your-app.vercel.app
EXTENSION_ID=your-chrome-extension-id
```

Include every origin that should call the API (landing on Vercel, local dev if needed).

---

## Post-deploy checklist

- [ ] `curl https://YOUR-API/health` → `{"status":"ok"}`
- [ ] Landing loads on Vercel
- [ ] Extension flows work against the Railway API URL

---

## Auto-deploy

- **Railway:** deploys on push to `main` (configure **Triggers** if you want branch/path filters).
- **Vercel:** deploys on push to connected branches; preview deployments for PRs.

---

## Rollback

- **Railway:** service → **Deployments** → previous deploy → **Rollback**
- **Vercel:** project → **Deployments** → **⋯** on a previous deployment → **Promote to Production**

---

## Cost (rough)

- **Railway:** free tier credit; API-only is usually modest at low traffic
- **Vercel:** hobby tier often covers a static marketing site
- **Chrome Web Store:** $5 one-time
- **OpenRouter / xAI:** usage-based

---

## Optional: API on Vercel instead of Railway

The repo includes `apps/api/api/index.ts` and `apps/api/vercel.json` for a serverless Hono deployment. Not the default for this project (we standardize on **Railway for API**), but you can add a second Vercel project with **Root Directory** `apps/api`, install from repo root, and build with `pnpm vercel-build` at the workspace root.
