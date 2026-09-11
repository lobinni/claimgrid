# ClaimGrid Intelligent Contract

`claimgrid.py` is the on-chain source of truth for provider pools, coverage items, claims, validator judgment, and settlement.

## Deploy in Studio

1. Open GenLayer Studio.
2. Select Studionet.
3. Create a new Intelligent Contract.
4. Paste `claimgrid.py`.
5. Deploy with a constructor value for `minimum_pool`, expressed in the contract's native integer unit.
6. Copy the deployed address into `deployments/studionet.json`.

The frontend only needs the address; it does not need contract source files at runtime.

## Public writes

- `register_provider(name, policy)` payable
- `update_policy(policy)`
- `add_pool()` payable
- `withdraw_pool(amount)`
- `set_provider_active(active)`
- `register_item(provider_address, name, value, proof_url)`
- `approve_item(item_id, duration_days)`
- `file_claim(item_id, description, evidence_urls, requested_pct)`
- `judge_claim(claim_id)`
- `withdraw_claim(claim_id)`
- `settle_claim(claim_id)`
- `expire_item(item_id)`

## Public views

- `get_config()`
- `get_provider(address)`
- `get_item(item_id)`
- `get_claim(claim_id)`
- `get_provider_items(address, offset, limit)`
- `get_customer_items(address, offset, limit)`
- `get_claim_ids(item_id)`

## Safety properties

The contract prevents providers from withdrawing reserved coverage, snapshots the policy version at registration, validates stored links, bounds claim retries, and fails closed when validator output cannot be parsed.

The native transfer recipient uses the EVM contract interface so wallet payouts are represented as native transfers rather than intelligent-contract messages.
