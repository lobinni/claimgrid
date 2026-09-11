export type Provider = {
  owner: string;
  name: string;
  policy: string;
  pool: bigint | number | string;
  reserved: bigint | number | string;
  active: boolean;
  policy_version: bigint | number | string;
  item_count: bigint | number | string;
  approved_claims: bigint | number | string;
  total_paid: bigint | number | string;
};

export type Item = {
  id: bigint | number | string;
  provider: string;
  customer: string;
  name: string;
  value: bigint | number | string;
  proof_url: string;
  policy_version: bigint | number | string;
  approved_at: bigint | number | string;
  duration_days: bigint | number | string;
  status: string;
  open_claim: bigint | number | string;
  paid: bigint | number | string;
};

export type Claim = {
  id: bigint | number | string;
  item_id: bigint | number | string;
  customer: string;
  description: string;
  evidence: string;
  requested_pct: bigint | number | string;
  awarded_pct: bigint | number | string;
  status: string;
  reason: string;
  cited_policy: string;
  filed_at: bigint | number | string;
  attempts: bigint | number | string;
  paid: boolean;
};

export const toNumber = (value: bigint | number | string | undefined | null) => Number(value ?? 0);
export const shortAddress = (value: string) => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "—";
export const toGen = (value: bigint | number | string) => (Number(value) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 4 });
