# Architecture

## Contract layer

`packages/contracts/claimgrid.py` is a GenLayer Intelligent Contract. It owns all authoritative provider, coverage, claim, policy-version, reserve, and settlement state.

## Shared layer

`packages/shared` contains frontend-safe domain types and numeric normalization. Contract integers can arrive as numbers, strings, or bigint values depending on the client path, so the UI normalizes them at the boundary.

## Web layer

The Vite React application uses `genlayer-js` for direct contract reads and MetaMask-backed writes. No API server is required.

Contract `Address` parameters are calldata addresses, not strings. Passing a plain hex string to an `Address`-typed view or write reverts with "execution failed" (viem reports it as "Missing or invalid parameters"). `apps/web/src/lib.ts` exposes `asAddress()` — which wraps the 20 raw bytes in `CalldataAddress` from `genlayer-js/types` — and `asU256()` for bigint ids. Every address/id argument at the contract boundary goes through them. This was verified against the live Studionet deployment: the same `get_provider` call reverts with a string argument and succeeds with `CalldataAddress`.

Writes are plain `eth_sendTransaction` calls through `window.ethereum` (EIP-1193). The wallet flow is deliberately Snap-free: although `genlayer-js`'s `client.connect()` can install the GenLayer Snap via `wallet_requestSnaps`, this app never invokes it — `apps/web/src/lib.ts` adds/switches the Studionet network (chain ID 61999) with `wallet_addEthereumChain`/`wallet_switchEthereumChain` and nothing more. MetaMask plus that network is the entire onboarding requirement.

## State flow

```text
MetaMask -> genlayer-js -> Studionet RPC -> ClaimGrid contract
                                      |
                                      +-> validator consensus for claim judgment
                                      |
                                      +-> native settlement transfer
```

## Address configuration

The application reads `VITE_CONTRACT_ADDRESS`. There is one configuration module and no contract address embedded in components. This makes a Studio redeployment a configuration-only change.

## Policy lifecycle

A provider policy has a version. New coverage records store the current version. Approval requires the stored version to equal the provider version. This prevents an old registration from being activated under a later policy.

## Solvency lifecycle

`reserved` is the value of active coverage not yet paid. Provider withdrawals are rejected whenever they would reduce `pool` below `reserved`.

## Consensus lifecycle

A claim begins as `OPEN`. Validators evaluate the provider policy, customer incident, and readable evidence. Comparative consensus normalizes percentage disagreement into ten-point buckets while keeping the covered/not-covered boundary exact. Invalid consensus leaves the claim open so an authorized party can retry.
