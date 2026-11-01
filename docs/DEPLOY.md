# Deploying the Illakiya web app

The web toolbox (`web/`) is a Vite/React SPA plus one Cloudflare Pages Function
(`web/functions/api/tamil.ts`, `POST /api/tamil`) that calls Claude. It deploys
to **Cloudflare Pages** at **https://illakiya.yazhi.dev** via GitHub Actions
(`.github/workflows/deploy.yml`).

## How it runs

On every push to `main` that touches `web/`, `data/`, or the workflow itself
(and via manual **Run workflow**), the action:

1. tests and builds the app — `cd web && npm ci && npm test && npm run build` → `web/dist`,
2. ensures the Pages project `illakiya` exists,
3. copies the `ANTHROPIC_API_KEY` GitHub secret onto the Pages project (if set),
4. deploys from `web/` — `dist` plus `functions/` — to Cloudflare Pages (production branch `main`).

SPA routing is handled by `web/public/_redirects` (`/* /index.html 200`), which
Vite copies into `dist/`.

## One-time setup

### 1. Cloudflare API token
Create a token at **Cloudflare dashboard → My Profile → API Tokens → Create
Token**, using the **"Cloudflare Pages — Edit"** permission (Account →
Cloudflare Pages → Edit). Copy the token.

Find your **Account ID** on the Cloudflare dashboard home (right sidebar) or any
domain's Overview page.

### 2. GitHub repository secrets
In **GitHub → repo Settings → Secrets and variables → Actions**, add:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | your Cloudflare account ID |
| `ANTHROPIC_API_KEY` | your Claude API key (powers `/api/tamil`) |

Instead of the `ANTHROPIC_API_KEY` GitHub secret you can set it once on the
Pages project: **Workers & Pages → illakiya → Settings → Variables and Secrets →
Add → Secret `ANTHROPIC_API_KEY`**. Without it `/api/tamil` answers 503 and only
the offline Tanglish tool works.

Optional: set `ANTHROPIC_BASE_URL` on the Pages project to route through a
gateway such as Cloudflare AI Gateway.

### Protect the endpoint
`/api/tamil` is public and spends API credit. Before announcing the site, add a
rate-limiting rule in **Cloudflare dashboard → yazhi.dev → Security → WAF →
Rate limiting rules** for `illakiya.yazhi.dev/api/*` (for example 20 requests
per minute per IP).

### 3. Custom domain
After the first successful deploy (which creates the `illakiya` Pages project),
attach the domain in **Cloudflare dashboard → Workers & Pages → illakiya →
Custom domains → Set up a custom domain → `illakiya.yazhi.dev`**. Because
`yazhi.dev` is already on Cloudflare, the DNS record is added automatically and
the site is live at https://illakiya.yazhi.dev.

## Manual deploy from your machine (optional)

```bash
cd web && npm ci && npm run build
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... \
  npx wrangler@3 pages deploy dist --project-name=illakiya --branch=main   # run inside web/ so functions/ is included
```
