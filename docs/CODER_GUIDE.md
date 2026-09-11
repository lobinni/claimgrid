# Coder Guide

## Replace the contract address

Change only `VITE_CONTRACT_ADDRESS` in `.env` for local work, or in Vercel environment settings for production hosting. The UI imports the value from `src/config.ts`.

## Add a new view

1. Add the view to `claimgrid.py`.
2. Add its TypeScript return type to `packages/shared/src/index.ts`.
3. Add a wrapper in `apps/web/src/lib.ts` only if the component needs a reusable helper.
4. Consume the view from a React component.
5. Add a deterministic test for the contract source and a frontend test for rendering.

## Write flow

Writes must always be routed through `writeContract()` so wallet connection and network selection remain centralized.

## No secrets in the browser

Never place a private key in a `VITE_*` variable. Browser transactions use MetaMask. Deployment keys, if ever required for automation, belong outside the frontend environment.
