import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { CalldataAddress } from 'genlayer-js/types';
import { CHAIN_ID, CONTRACT_ADDRESS, EXPLORER_URL, NETWORK_NAME, RPC_URL } from './config';

declare global {
  interface Window { ethereum?: any }
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

// Encodes a 0x-prefixed hex address as a calldata ADDRESS (20 raw bytes).
// GenLayer view/write params typed `Address` reject plain hex strings — the
// call reverts with "execution failed". Every address argument must go
// through this helper before reaching readContract/writeContract.
export function asAddress(value: string): CalldataAddress {
  const trimmed = (value || '').trim();
  if (!ADDRESS_RE.test(trimmed)) throw new Error('Invalid address: expected 0x followed by 40 hex characters.');
  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    bytes[i] = parseInt(trimmed.slice(2 + i * 2, 4 + i * 2), 16);
  }
  return new CalldataAddress(bytes);
}

// u256 params must be bigint/number, never a string digit (a string would be
// encoded as a calldata string and revert the call as well).
export function asU256(value: bigint | number | string): bigint {
  return BigInt(value);
}

export const readClient = createClient({ chain: studionet });

export const makeWriteClient = (account: string) => createClient({
  chain: studionet,
  account: account as `0x${string}`,
  provider: window.ethereum as any,
});

// Snap-free network bootstrap. genlayer-js's client.connect() also installs
// the GenLayer Snap through wallet_requestSnaps — this app intentionally does
// NOT do that. Users only need MetaMask plus the Studionet network (chain
// 61999); writes are plain eth_sendTransaction calls signed by MetaMask.
export async function connectNetwork() {
  const ethereum = typeof window !== 'undefined' ? window.ethereum : undefined;
  if (!ethereum) throw new Error('MetaMask was not detected.');

  const chainIdHex = `0x${CHAIN_ID.toString(16)}`;
  const current = await ethereum.request({ method: 'eth_chainId' });
  if (String(current).toLowerCase() === chainIdHex.toLowerCase()) return;

  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
  } catch (error: any) {
    // 4902 / "unrecognized chain" — the network is not in MetaMask yet, add it.
    if (error?.code === 4902 || error?.data?.originalError?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: NETWORK_NAME,
          rpcUrls: [RPC_URL],
          nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
          blockExplorerUrls: [EXPLORER_URL],
        }],
      });
    } else {
      throw error;
    }
  }
}

export async function readContract(functionName: string, args: unknown[] = []) {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address is not configured.');
  return readClient.readContract({ address: CONTRACT_ADDRESS as `0x${string}`, functionName, args: args as any });
}

export async function writeContract(account: string, functionName: string, args: unknown[] = [], value?: bigint) {
  if (!CONTRACT_ADDRESS) throw new Error('Contract address is not configured.');
  // Re-assert the network before every write: the user may have switched
  // chains after connecting, and signing on the wrong chain must not happen.
  await connectNetwork();
  const client = makeWriteClient(account);
  const call: any = { address: CONTRACT_ADDRESS as `0x${string}`, functionName, args: args as any };
  if (value !== undefined) call.value = value;
  const tx = await client.writeContract(call);
  // Wait until the transaction is accepted so the state refresh that follows
  // actually sees it. The wait is best-effort: a slow network must not fail a
  // transaction that was already submitted — the UI keeps polling via manual
  // refreshes in that case.
  try {
    await client.waitForTransactionReceipt({ hash: tx as any, status: 'ACCEPTED' as any, interval: 2000, retries: 45 });
  } catch {
    // ignore — refresh happens regardless
  }
  return tx;
}
