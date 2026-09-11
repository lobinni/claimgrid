import { connectNetwork } from './lib';

declare global {
  interface Window { ethereum?: any }
}

export async function connectWallet(): Promise<string> {
  if (!window.ethereum) throw new Error('MetaMask was not detected.');
  await connectNetwork();
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts?.[0]) throw new Error('No wallet account was returned.');
  return accounts[0];
}

export async function getCurrentAccount(): Promise<string | null> {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts?.[0] || null;
}
