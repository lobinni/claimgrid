# Deployment Guide

## Studio deployment

The easiest path is the Studio UI. Deploy `packages/contracts/claimgrid.py` to Studionet and copy the resulting address.

Update:

1. `deployments/studionet.json`
2. local `.env`
3. Vercel `VITE_CONTRACT_ADDRESS`

No frontend source file needs to change.

## Record a deployment

You can also run:

```bash
CONTRACT_ADDRESS=0xYOUR_ADDRESS node packages/contracts/scripts/deploy.mjs
```

This writes the current address and network metadata into `deployments/studionet.json`.

## Vercel

The repository is a client-side Vite application. All settings are committed in `vercel.json`, so a fresh import requires no dashboard changes:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback rewrite: `/(.*) -> /index.html`
- Node >= 20.19 via `engines` (Vite 7 requirement)

The build emits to both `apps/web/dist` and a root-level `dist/`. This is deliberate: Vercel's Vite preset defaults the Output Directory to `dist` and dashboard Project Settings override `vercel.json`, so either effective value resolves to a real directory. If a previously imported project failed with `No Output Directory named "dist" found`, redeploy after pulling this change — no settings edit is needed. Alternatively, in the Vercel dashboard open **Settings → Build and Output Settings → Output Directory**, enable Override, and enter `apps/web/dist`.

Environment variables are optional overrides. With none set, the build points at the live Studionet deployment from `deployments/studionet.json`:

```text
VITE_CONTRACT_ADDRESS=0x...
VITE_NETWORK=studionet
VITE_CHAIN_ID=61999
VITE_RPC_URL=https://studio.genlayer.com/api
VITE_EXPLORER_URL=https://explorer-studio.genlayer.com
```

There is no `DATABASE_URL`, no database, and no server function. Do not link a Vercel Postgres/Storage integration to this project — nothing reads it.

## GitHub

```bash
git init
git add .
git commit -m "Initial ClaimGrid release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/claimgrid.git
git push -u origin main
```
