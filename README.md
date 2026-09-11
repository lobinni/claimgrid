# ClaimGrid

ClaimGrid is a GenLayer-powered coverage registry where providers lock GEN behind written coverage rules, customers register covered items, and AI validator consensus evaluates submitted incidents against the provider's published policy.

The repository is intentionally backend-free. The web application reads state directly from the Intelligent Contract and signs writes through MetaMask. There is no database and no `DATABASE_URL` requirement.

## Highlights

- Provider pools with a configurable minimum stake.
- Immutable policy snapshots for active coverage.
- Customer coverage registration and provider approval.
- Evidence-aware claim submission.
- Validator consensus for natural-language claim decisions.
- Fail-closed judgment when a usable consensus result cannot be produced.
- Permissionless settlement of approved claims.
- Solvency accounting so provider withdrawals cannot exceed free liquidity.
- Centralized contract-address configuration for easy redeployment.
- Studionet-first MetaMask flow using chain ID 61999 — no Snap, plugin, or extension beyond MetaMask is ever requested or installed.
- Vercel-compatible SPA routing with no server or database.

## Architecture

```text
apps/web                  React + Vite frontend
packages/shared           Shared domain types and normalization helpers
packages/contracts        GenLayer Intelligent Contract and tests
deployments               Human-readable deployment records
docs                      Setup, contract, testing and deployment guides
scripts                   Local developer utilities
```

The application follows the same broad monorepo separation used by modern GenLayer dApps: contract, shared types, and frontend are independent packages. The implementation and naming are original to this project.

## Network

The default network is GenLayer Studionet:

- RPC: `https://studio.genlayer.com/api`
- Chain ID: `61999`
- Currency: `GEN`
- Explorer: `https://explorer-studio.genlayer.com`

These values are centralized in `apps/web/src/config.ts` and can also be overridden by Vite environment variables.

## Quick start

Requirements: Node.js 18+, npm 9+, Python 3.10+.

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` and replace `VITE_CONTRACT_ADDRESS` after deploying the contract in Studio.

## Deploy the contract

The recommended workflow is to open Studio, create or paste `packages/contracts/claimgrid.py`, deploy it to Studionet, copy the resulting address, and update:

`deployments/studionet.json`

and

`.env`

The frontend does not contain a hard-coded deployment address. Redeploying only requires changing the deployment record or `VITE_CONTRACT_ADDRESS`.

## Manual flow

1. Connect MetaMask — plain EIP-1193 only; the app never installs a MetaMask Snap or any other plugin.
2. The app adds/switches the wallet to Studionet (chain ID 61999) via `wallet_addEthereumChain`/`wallet_switchEthereumChain` — that network plus MetaMask is the entire requirement to participate.
3. Register a provider with a GEN pool and written coverage policy.
4. Switch to a second wallet and register an item against the provider.
5. Return to the provider wallet and approve the item.
6. Submit an incident from the customer wallet.
7. Wait for validator judgment.
8. If approved, settle the claim from the claim panel.

See `docs/MANUAL_TEST.md` for a complete walkthrough.

## Tests

```bash
npm run test:contract
npm run test:web
npm run test
npm run lint:contract
```

The contract tests focus on deterministic business rules. Consensus execution itself must be verified on Studio because validator behavior is not reproduced by a local Python unit test.

## Vercel

This project is a static Vite application. Vercel only needs the repository and build command. There is no backend, no serverless function, no Postgres/Redis integration, and no `DATABASE_URL` anywhere in the codebase — nothing external is provisioned at build or runtime.

Every setting Vercel needs is already committed in `vercel.json`, so importing the repo works with zero manual configuration:

- Framework: Vite (auto-detected from `vercel.json`)
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback rewrite: `/(.*) -> /index.html`
- Node.js: pinned through `engines` in `package.json` (>= 20.19, required by Vite 7)
- Reproducible installs: `package-lock.json` is committed

The build emits the static site to **both** `apps/web/dist` and a root-level `dist/` (`scripts/sync-dist.mjs`). This matters because Vercel's Vite preset defaults the Output Directory to `dist`, and dashboard Project Settings take precedence over `vercel.json` — so whichever value the project uses, the directory exists and the deploy succeeds. If you imported the project earlier and hit `No Output Directory named "dist" found`, just redeploy; no dashboard change is required.

Environment variables are **optional overrides**. Without any of them the app builds and points at the live Studionet deployment recorded in `deployments/studionet.json` (see `apps/web/src/config.ts`). Set them in Vercel only if you redeploy the contract:

- `VITE_CONTRACT_ADDRESS`
- `VITE_NETWORK=studionet`
- `VITE_CHAIN_ID=61999`
- `VITE_RPC_URL=https://studio.genlayer.com/api`
- `VITE_EXPLORER_URL=https://explorer-studio.genlayer.com`

## GitHub

```bash
git init
git add .
git commit -m "ClaimGrid: Vercel-ready, backend-free release"
git branch -M main
git remote add origin https://github.com/lobinni/claimgrid.git
git push -u origin main
```

## Important limitation

Studionet is a development environment. Do not treat GEN balances there as production funds. Validate any production-like economics and payout behavior on the appropriate public testnet before using real value.
