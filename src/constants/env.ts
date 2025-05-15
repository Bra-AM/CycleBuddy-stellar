// Stellar network configuration
export const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';
export const SERVER_SOROBAN_URL = import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const HORIZON_URL = import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org';
export const NETWORK_PASSPHRASE = NETWORK === 'mainnet' 
  ? 'Public Global Stellar Network ; September 2015' 
  : 'Test SDF Network ; September 2015';

// Contract IDs - using valid token contract ID as placeholder
// This is a valid token contract ID on Stellar testnet
const PLACEHOLDER_CONTRACT_ID = 'CDODVYRDXBFQS5M45IV4UULMCEGWPVIQ3MK7JJV3XPS7AUGED3ZXKUIP';
export const REGISTRY_CONTRACT_ID = import.meta.env.VITE_REGISTRY_CONTRACT_ID || PLACEHOLDER_CONTRACT_ID;
export const AUTH_CONTRACT_ID = import.meta.env.VITE_AUTH_CONTRACT_ID || PLACEHOLDER_CONTRACT_ID;
export const DATA_CONTRACT_ID = import.meta.env.VITE_DATA_CONTRACT_ID || PLACEHOLDER_CONTRACT_ID;
export const COMMUNITY_CONTRACT_ID = import.meta.env.VITE_COMMUNITY_CONTRACT_ID || PLACEHOLDER_CONTRACT_ID;

// IPFS configuration
export const IPFS_API_URL = import.meta.env.VITE_IPFS_API_URL || 'https://ipfs.infura.io:5001';
export const IPFS_GATEWAY_URL = import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs';
export const IPFS_PROJECT_ID = import.meta.env.VITE_IPFS_PROJECT_ID;
export const IPFS_PROJECT_SECRET = import.meta.env.VITE_IPFS_PROJECT_SECRET;

// WebAuthn/Passkey configuration
export const RP_ID = import.meta.env.VITE_RP_ID || window.location.hostname;
export const RP_NAME = import.meta.env.VITE_RP_NAME || 'CycleBuddy';
export const RP_ORIGIN = import.meta.env.VITE_RP_ORIGIN || window.location.origin;

// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// LaunchTube configuration
export const LAUNCH_TUBE_API_KEY = import.meta.env.VITE_LAUNCH_TUBE_API_KEY;
export const LAUNCH_TUBE_PROJECT_ID = import.meta.env.VITE_LAUNCH_TUBE_PROJECT_ID; 