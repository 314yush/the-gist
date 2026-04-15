# Deployment Guide — The Gist

> **Names:** Use [Railway](https://railway.app) (not “Rainway”) for container/static hosting. The GitHub remote for this repo is **https://github.com/314yush/the-gist.git**.

Deploy targets:

| Unit | Where | Type |
|------|-------|------|
| **API** (`apps/api`) | Railway (Docker) *or* Vercel (serverless) | Both supported in-repo |
| **Landing** (`apps/landing`) | Railway | Static site (Dockerfile) |
| **Extension** (`apps/extension`) | Chrome Web Store | Manual zip upload |

---

## Prerequisites

- GitHub account
- Railway account (https://railway.app) — connect it to your GitHub
- Chrome Web Store Developer account ($5 one-time: https://chrome.google.com/webstore/devconsole)
- Your API keys ready: `OPENROUTER_API_KEY`, `XAI_API_KEY`, `AUTH_SECRET`

---

## Step 0: Push to GitHub

If the repo **https://github.com/314yush/the-gist** is empty (or you are replacing history only with local agreement):

```bash
cd /path/to/the-gist   # your clone of eli5 / the-gist monorepo

git init
git branch -M main
git add .
git commit -m "Initial commit"

git remote add origin https://github.com/314yush/the-gist.git
git push -u origin main
```

If you prefer the GitHub CLI and the repo does not exist yet:

```bash
gh repo create the-gist --private --source=. --remote=origin --push
```

(`gh` will match the name to https://github.com/314yush/the-gist if you use that exact name.)

---

## (Alternative) Deploy API on Vercel

The API includes a Vercel adapter at `apps/api/api/index.ts` and `apps/api/vercel.json`. Use this **instead of** Railway for the backend if you want serverless on Vercel.

1. Import the GitHub repo in [Vercel](https://vercel.com) → **Add New** → **Project**.
2. **Root Directory:** `apps/api`.
3. **Framework Preset:** Other (or “Hono” if shown).
4. **Install Command** (pnpm workspace; run from repo root):

   ```bash
   cd ../.. && pnpm install --frozen-lockfile
   ```

5. **Build Command** (uses the root `vercel-build` script):

   ```bash
   cd ../.. && pnpm vercel-build
   ```

6. Set the same env vars as Railway (see [Step 1.2](#12-set-environment-variables)), e.g. `OPENROUTER_API_KEY`, `XAI_API_KEY`, `AUTH_SECRET`, `CORS_ORIGINS`, optional `EXTENSION_ID`, `RATE_LIMIT_RPM`, etc.
7. Deploy. Your API routes are served via the serverless entry; health is available at `/health` (and `/v1/health` per app routes).

**Note:** You typically deploy **either** Railway **or** Vercel for the API, not both, unless you use different URLs for staging vs production.

---

## Step 1: Deploy API on Railway

### 1.1 Create the project

1. Go to https://railway.app/dashboard
2. Click **"New Project"** → **"Deploy from GitHub Repo"**
3. Select the `thegist` repo
4. Railway auto-detects the `railway.toml` at `apps/api/railway.toml`
   - If it doesn't, set **Root Directory** to `/` (the Dockerfile path in railway.toml is already `apps/api/Dockerfile`)

### 1.2 Set environment variables

In Railway dashboard → your service → **Variables** tab, add:

```
NODE_ENV=production
PORT=3000
OPENROUTER_API_KEY=sk-or-v1-your-key
XAI_API_KEY=xai-your-key
AUTH_SECRET=<run: openssl rand -base64 32>
RATE_LIMIT_RPM=60
CORS_ORIGINS=https://thegist.app
```

Optional:
```
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_IMAGE_MODEL=google/gemini-2.5-flash-image-preview
EXTENSION_ID=<your-chrome-extension-id-once-published>
INVITE_CODE=<if-you-want-invite-gating>
```

### 1.3 Set the config file path

Railway needs to know where the `railway.toml` is. In the service **Settings**:

- **Config file path**: `apps/api/railway.toml`

### 1.4 Generate a domain

In **Settings** → **Networking** → click **"Generate Domain"**.

You'll get something like `thegist-api-production.up.railway.app`.

Save this URL — you'll need it for the extension and landing page.

### 1.5 (Optional) Custom domain

If you want `api.thegist.app`:
1. In Railway **Settings** → **Networking** → **Custom Domain** → add `api.thegist.app`
2. Add the CNAME record Railway gives you to your DNS provider

### 1.6 Verify

```bash
curl https://YOUR-RAILWAY-DOMAIN/health
# Should return: {"status":"ok"}
```

---

## Step 2: Deploy Landing Page on Railway

### 2.1 Add a new service in the same Railway project

1. In your Railway project, click **"+ New"** → **"GitHub Repo"** → select same repo
2. Railway will auto-detect the Dockerfile

### 2.2 Set the config file path

In the service **Settings**:

- **Config file path**: `apps/landing/railway.toml`

No environment variables needed — it's a static site.

### 2.3 Generate domain / custom domain

Same as API — generate a Railway domain or add `thegist.app` as custom domain.

---

## Step 3: Point Extension at Production API

Before building the extension for the Chrome Web Store, update the default API URL.

### 3.1 Update the default API URL in the extension

Edit `apps/extension/src/lib/api.ts`, line 13:

```typescript
// Change from:
return (await getLocal('apiUrl')) || 'http://localhost:3000';
// Change to:
return (await getLocal('apiUrl')) || 'https://YOUR-RAILWAY-DOMAIN';
```

Replace `YOUR-RAILWAY-DOMAIN` with your actual Railway API URL (e.g., `https://api.thegist.app` or `https://thegist-api-production.up.railway.app`).

### 3.2 Build the extension

```bash
cd /Users/piyush/eli5
pnpm --filter @thegist/extension build
```

The built extension is in `apps/extension/dist/`.

### 3.3 Create the zip

```bash
cd apps/extension/dist
zip -r ../thegist-extension.zip .
```

---

## Step 4: Publish Extension to Chrome Web Store

### 4.1 First-time setup

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay the $5 developer registration fee if you haven't
3. Click **"New Item"**

### 4.2 Upload

1. Click **"Upload"** → select `apps/extension/thegist-extension.zip`
2. Fill in the store listing:
   - **Name**: The Gist
   - **Summary**: One-click explanations personalized to your knowledge
   - **Description**: Select, copy, or just click — The Gist explains it your way. Select text on any page to get instant, personalized explanations powered by AI.
   - **Category**: Productivity
   - **Language**: English

### 4.3 Add required assets

You'll need:
- **Icon**: 128x128 PNG (already at `public/icons/icon-128.png`)
- **Screenshots**: At least 1 screenshot (1280x800 or 640x400)
- **Promo tile**: 440x280 (optional but recommended)

### 4.4 Privacy practices

- **Single purpose**: Explain selected text using AI
- **Permissions justification**:
  - `contextMenus`: Right-click "Explain" menu
  - `scripting`: Read selected text from active tab
  - `storage`: Save user preferences and auth token
  - `activeTab`: Access current tab for text selection
  - `<all_urls>`: Content script runs on all pages to detect text selection
- **Data use**: No data sold, no data used for purposes unrelated to the extension

### 4.5 Submit for review

Click **"Submit for Review"**. Reviews typically take 1-3 business days.

### 4.6 After approval

1. Copy your **Extension ID** from the developer console
2. Add it to your Railway API env vars: `EXTENSION_ID=your-extension-id`
3. (Optional) Update the landing page CTA link to point to your Chrome Web Store listing

---

## Step 5: Update CORS for Production

Once you have your extension ID, update Railway API environment variables:

```
CORS_ORIGINS=https://thegist.app
EXTENSION_ID=your-chrome-extension-id
```

This locks down CORS to only allow requests from your landing page and your specific extension.

---

## Post-Deploy Checklist

- [ ] `curl https://YOUR-API-DOMAIN/health` returns `{"status":"ok"}`
- [ ] Landing page loads at your domain
- [ ] Extension installed from Chrome Web Store (or loaded unpacked for testing)
- [ ] Select text → pill → click → overlay with explanation
- [ ] Right-click text → "Explain with The Gist" → overlay
- [ ] Right-click link → "Explain this link" → overlay
- [ ] Click toolbar icon → overlay opens
- [ ] `Cmd+Shift+L` → overlay opens
- [ ] Options page accessible (right-click extension icon → Options)

---

## Auto-Deploy (GitHub Push → Railway)

Railway auto-deploys on every push to `main` by default. No CI/CD config needed.

If you want to limit deploys:
- Railway Settings → **Triggers** → set to deploy only on specific branches or paths

---

## Rollback

Railway keeps deploy history. To rollback:
1. Go to your service → **Deployments** tab
2. Click on a previous successful deploy
3. Click **"Rollback"**

---

## Cost Estimate

- **Railway**: Free tier gives $5/month credit. API + landing page should fit within ~$5-10/month at low traffic. Pay-as-you-go after that.
- **Chrome Web Store**: $5 one-time registration fee
- **OpenRouter**: Pay per API call (varies by model)
- **xAI**: Pay per API call for Twitter/Grok features
