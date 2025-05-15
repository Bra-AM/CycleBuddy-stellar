import { ChainMetadata } from '@soroban-react/core';

export const testnetChainMetadata: ChainMetadata = {
  id: 'testnet',
  name: 'Testnet',
  networkPassphrase: 'Test SDF Network ; September 2015',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  iconBackground: '#000000',
  icon: '/stellar-logo.svg',
  networkUrl: 'https://horizon-testnet.stellar.org',
  defaultRpcTimeout: 60000, // 60 seconds timeout for RPC calls
};

export const allowHttp = true; // Enable HTTP for local development
export const defaultTimeoutHint = 60; // Default timeout hint in seconds 