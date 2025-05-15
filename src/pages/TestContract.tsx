import { useState, useEffect } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { SorobanRpc } from '@stellar/stellar-sdk';
import WalletConnect from '../components/common/WalletConnect';
import DevToolsNav from '../components/common/DevToolsNav';

export function TestContract() {
  const { activeChain, server, address } = useSorobanReact();
  const [contractId, setContractId] = useState('');
  const [methodName, setMethodName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testContracts = [
    { id: import.meta.env.VITE_REGISTRY_CONTRACT_ID, name: 'Registry Contract' },
    { id: import.meta.env.VITE_AUTH_CONTRACT_ID, name: 'Auth Contract' },
    { id: import.meta.env.VITE_DATA_CONTRACT_ID, name: 'Data Contract' },
    { id: import.meta.env.VITE_COMMUNITY_CONTRACT_ID, name: 'Community Contract' },
    { id: import.meta.env.VITE_DONATION_CONTRACT_ID, name: 'Donation Contract' },
    { id: import.meta.env.VITE_DATA_SHARING_CONTRACT_ID, name: 'Data Sharing Contract' },
    { id: import.meta.env.VITE_REWARDS_CONTRACT_ID, name: 'Rewards Contract' },
    { id: import.meta.env.VITE_ZK_VALIDATION_CONTRACT_ID, name: 'ZK Validation Contract' },
    { id: import.meta.env.VITE_DATA_MARKETPLACE_CONTRACT_ID, name: 'Data Marketplace Contract' },
    { id: import.meta.env.VITE_HEALTH_ALERTS_CONTRACT_ID, name: 'Health Alerts Contract' }
  ];

  async function checkContract() {
    if (!contractId) {
      setError('Please select a contract');
      return;
    }

    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!server) {
      setError('Soroban server is not available');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Try to get the contract's ledger entry
      const response = await server.getContractData(contractId);
      setResult(response);
    } catch (err: any) {
      console.error('Error checking contract:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // If error contains XDR Write Error, show a more helpful message
  const displayError = error && error.includes('XDR Write Error') 
    ? `${error} - This error usually occurs when the contract doesn't exist or isn't properly deployed. Please verify the contract ID.`
    : error;

  return (
    <div>
      <DevToolsNav />
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Contract Test Page</h1>
        
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 p-4 bg-gray-50 rounded-md">
            <div>
              <p className="text-gray-700">Network: {activeChain?.name || 'Unknown'}</p>
              <p className="text-gray-700 mt-1">
                {address ? `Connected as: ${address.substring(0, 8)}...${address.substring(address.length - 8)}` : 'Not connected'}
              </p>
            </div>
            <div className="shrink-0">
              <WalletConnect promptText="Connect to check contracts" />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Contract:
          </label>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md" 
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
          >
            <option value="">-- Select a Contract --</option>
            {testContracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.name} ({contract.id.slice(0, 8)}...)
              </option>
            ))}
          </select>
        </div>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={checkContract}
          disabled={loading || !address}
        >
          {loading ? 'Checking...' : 'Check Contract'}
        </button>
        
        {displayError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {displayError}
          </div>
        )}
        
        {result && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Contract Data:</h3>
            <pre className="p-4 bg-gray-100 rounded-md overflow-auto max-h-80">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestContract; 