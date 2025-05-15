import { SorobanRpc } from '@stellar/stellar-sdk';

/**
 * Checks if a contract exists on the network
 * @param server Soroban RPC server
 * @param contractId Contract ID to check
 * @returns true if the contract exists, false otherwise
 */
export async function doesContractExist(server: SorobanRpc.Server, contractId: string): Promise<boolean> {
  try {
    await server.getContractData(contractId);
    return true;
  } catch (error) {
    try {
      const codeResult = await server.getContractCode(contractId);
      // If we can get the code but not the data, the contract exists but might not be initialized
      return !!codeResult;
    } catch (codeError) {
      return false;
    }
  }
}

/**
 * Feature enablement based on contract availability
 */
export interface FeatureStatus {
  isAvailable: boolean;
  contractId: string | null;
  errorMessage?: string;
  simulationMode?: boolean;
}

/**
 * Check if a feature is available based on its contract
 * @param server Soroban RPC server
 * @param contractId Contract ID for the feature
 * @param featureName Name of the feature for error messages
 * @returns Feature status object
 */
export async function checkFeatureAvailability(
  server: SorobanRpc.Server | null, 
  contractId: string,
  featureName: string
): Promise<FeatureStatus> {
  // If no server, use simulation
  if (!server) {
    return {
      isAvailable: true,
      contractId: null,
      simulationMode: true,
      errorMessage: 'No Soroban server connection - using simulation mode'
    };
  }

  // If no contract ID, feature is not available
  if (!contractId) {
    return {
      isAvailable: false,
      contractId: null,
      errorMessage: `${featureName} contract ID not configured`
    };
  }

  try {
    // Check if contract exists
    const exists = await doesContractExist(server, contractId);
    if (exists) {
      return {
        isAvailable: true,
        contractId: contractId
      };
    } else {
      return {
        isAvailable: false,
        contractId: contractId,
        errorMessage: `${featureName} contract not found on the network`
      };
    }
  } catch (error: any) {
    // Error checking contract
    return {
      isAvailable: false,
      contractId: contractId,
      errorMessage: `Error checking ${featureName} contract: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Generate simulated response for when a contract is not available
 * @param type Type of data to simulate
 * @returns Simulated data
 */
export function getSimulatedResponse(type: string): any {
  switch (type) {
    case 'donation_total':
      return Math.floor(Math.random() * 10000) / 100; // Random donation amount
    case 'donation_history':
      return Array(5).fill(0).map((_, i) => ({
        id: `sim-${i}`,
        amount: Math.floor(Math.random() * 1000) / 100,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        donor: 'Anonymous'
      }));
    case 'rewards_balance':
      return Math.floor(Math.random() * 500);
    case 'rewards_history':
      return Array(3).fill(0).map((_, i) => ({
        id: `sim-${i}`,
        points: Math.floor(Math.random() * 50),
        date: new Date(Date.now() - i * 86400000).toISOString(),
        activity: ['Activity tracking', 'Data sharing', 'Community participation'][i % 3]
      }));
    default:
      return { simulated: true, message: 'Simulated response' };
  }
} 