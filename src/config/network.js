/**
 * Network configuration for Stellar/Soroban interaction
 */

export const NETWORKS = {
  FUTURENET: {
    name: 'futurenet',
    networkPassphrase: 'Test SDF Future Network ; October 2022',
    sorobanRpcUrl: 'https://rpc-futurenet.stellar.org',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
  },
  TESTNET: {
    name: 'testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
    sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
  },
};

// Set the active network
export const ACTIVE_NETWORK = NETWORKS.TESTNET; // Change this to switch networks

// Network-specific configuration
export const getNetworkConfig = () => {
  return {
    network: ACTIVE_NETWORK.name,
    networkPassphrase: ACTIVE_NETWORK.networkPassphrase,
    sorobanRpcUrl: ACTIVE_NETWORK.sorobanRpcUrl,
    horizonUrl: ACTIVE_NETWORK.horizonUrl,
  };
};

// Helper to check if we're on testnet
export const isTestnet = () => ACTIVE_NETWORK.name === 'testnet';

// Helper to check if we're on futurenet
export const isFuturenet = () => ACTIVE_NETWORK.name === 'futurenet'; 