import fs from 'node:fs';

const address = process.env.CONTRACT_ADDRESS || process.argv[2];
if (!address) {
  console.error('Usage: CONTRACT_ADDRESS=0x... node packages/contracts/scripts/deploy.mjs');
  process.exit(1);
}

const deployment = {
  network: 'studionet',
  chainId: 61999,
  rpcUrl: 'https://studio.genlayer.com/api',
  explorerUrl: 'https://explorer-studio.genlayer.com',
  contractName: 'ClaimGrid',
  contractAddress: address,
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(new URL('../../../deployments/studionet.json', import.meta.url), JSON.stringify(deployment, null, 2) + '\n');
console.log(`Saved deployment: ${address}`);
