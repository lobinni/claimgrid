import { describe, expect, it } from 'vitest';
import { CHAIN_ID, NETWORK_NAME, RPC_URL } from './config';

describe('network configuration', () => {
  it('targets Studionet by default', () => {
    expect(CHAIN_ID).toBe(61999);
    expect(RPC_URL).toBe('https://studio.genlayer.com/api');
    expect(NETWORK_NAME).toContain('Studionet');
  });
});
