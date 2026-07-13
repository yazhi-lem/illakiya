# Deploying the Illakiya web app

The web editor (`web/`) is a static Vite/React SPA. It deploys to **Cloudflare
Pages** at **https://illakiya.yazhi.dev** via GitHub Actions
(`.github/workflows/deploy.yml`).

## How it runs

On every push to `main` that touches `web/`, `data/`, or the workflow itself
(and via manual **Run workflow**), the action:

1. builds the app — `cd web && npm ci && npm run build` → `web/dist`,
2. ensures the Pages project `illakiya` exists,
3. deploys `web/dist` to Cloudflare Pages (production branch `main`).

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
  npx wrangler@3 pages deploy dist --project-name=illakiya --branch=main
```
