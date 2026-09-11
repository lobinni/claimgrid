# Manual Test Guide

## 1. Prepare MetaMask

Use GenLayer Studionet:

- Network name: GenLayer Studionet
- RPC URL: `https://studio.genlayer.com/api`
- Chain ID: `61999`
- Currency: GEN
- Explorer: `https://explorer-studio.genlayer.com`

Studio also exposes a wallet/faucet flow from the account selector.

No MetaMask Snap or any other plugin is required. The app adds/switches the network itself when you connect (MetaMask will show the standard "add network" and "switch network" prompts only).

## 2. Deploy

Deploy `packages/contracts/claimgrid.py` in Studio. Use a small minimum pool suitable for your test balance. Copy the contract address into `.env` as `VITE_CONTRACT_ADDRESS`.

## 3. Provider wallet

Connect wallet A and register:

- Provider name: Atlas Coverage
- Policy: use the default policy in the Provider screen or write your own policy with explicit covered failures and exclusions.
- Initial pool: enough to cover the test item.

Confirm the provider profile shows a non-zero pool.

## 4. Customer wallet

Switch MetaMask to wallet B and reload. Enter wallet A's provider address. Register an item with a small value and a public HTTPS proof URL.

The item should become `PENDING`.

## 5. Provider approval

Switch back to wallet A. Select the item ID and approve a 30-day duration.

The item should become `ACTIVE` and the provider's reserved balance should increase by the item value.

## 6. File a claim

Switch to wallet B. Select the active item. Enter a specific incident description and optional public HTTPS evidence. Submit the claim.

The contract invokes validator consensus. The claim should resolve to `APPROVED` or `DENIED` depending on the policy and incident.

## 7. Settlement

For an approved claim, click `Settle approved claim`. Anyone may submit the settlement transaction, while the contract always pays the registered customer.

## 8. Expiry

For a coverage record with no open claim, wait until its duration ends or use a controlled local test environment. Then call `expire_item` and verify that the reserved amount is released.

## Expected failure tests

- Provider registration below the minimum pool: rejected.
- Customer attempts to approve an item: rejected.
- Provider tries to withdraw reserved liquidity: rejected.
- Customer registers with a malformed proof URL: rejected.
- Claim with private/local evidence URL: rejected.
- Second open claim for the same item: rejected.
- Policy update while active coverage exists: rejected.
