# Release Checklist

1. Deploy `packages/contracts/claimgrid.py` in GenLayer Studio on Studionet.
2. Copy the deployed contract address into `.env`.
3. Update `deployments/studionet.json`.
4. Run `npm install`.
5. Run `npm test`.
6. Run `npm run build` (emits both `apps/web/dist` and the root `dist/` Vercel reads).
7. Deploy to Vercel — import the repo; the committed `vercel.json` covers every setting.
8. Test MetaMask on chain ID 61999.
9. Verify read operations and at least one write transaction on the deployed contract.

The application does not require a database and does not use `DATABASE_URL`.
