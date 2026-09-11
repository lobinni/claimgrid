// Central runtime configuration. Everything the UI needs about the network
// lives here — no contract address or RPC endpoint is hard-coded elsewhere.

// Live Studionet deployment, mirrored in deployments/studionet.json.
// VITE_CONTRACT_ADDRESS overrides this; the fallback only exists so a
// zero-configuration Vercel deploy works out of the box.
export const DEFAULT_CONTRACT_ADDRESS = '0x190346355DEBf21D19eFFf69c21A0d0C96C23241';

export const NETWORK = import.meta.env.VITE_NETWORK || 'studionet';
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 61999);
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://studio.genlayer.com/api';
export const EXPLORER_URL = import.meta.env.VITE_EXPLORER_URL || 'https://explorer-studio.genlayer.com';
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS).trim();
export const NETWORK_NAME = 'GenLayer Studionet';
export const isConfigured = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS) && !/^0x0+$/.test(CONTRACT_ADDRESS);
