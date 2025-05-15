import { useState, useEffect } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { Asset, Contract, TransactionBuilder, Networks, Operation, SorobanRpc } from '@stellar/stellar-sdk';
import freighter from '@stellar/freighter-api';
import DevToolsNav from '../components/common/DevToolsNav';

export function VerifyContracts() {
  const { activeChain, server, address, connect } = useSorobanReact();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const contractList = [
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

  const connectWallet = async () => {
    try {
      if (connect) {
        await connect();
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setErrorMsg('Failed to connect wallet');
    }
  };

  useEffect(() => {
    if (!address) {
      connectWallet();
    }
  }, [address]);

  const verifyContracts = async () => {
    if (!server || !address) {
      setErrorMsg('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    
    const newStatus: Record<string, string> = {};
    
    for (const contract of contractList) {
      if (!contract.id) {
        newStatus[contract.name] = 'No contract ID';
        continue;
      }
      
      try {
        // First, get the contract data
        try {
          const data = await server.getContractData(contract.id);
          newStatus[contract.name] = 'Exists on the network';
        } catch (error: any) {
          // Try to get the contract code
          try {
            const codeResult = await server.getContractCode(contract.id);
            if (codeResult) {
              newStatus[contract.name] = 'Contract code exists, but not properly initialized';
            } else {
              newStatus[contract.name] = 'Contract does not exist';
            }
          } catch (codeError) {
            newStatus[contract.name] = `Error: Contract not found`;
          }
        }
      } catch (err: any) {
        console.error(`Error checking ${contract.name}:`, err);
        newStatus[contract.name] = `Error: ${err.message || 'Unknown error'}`;
      }
    }
    
    setStatus(newStatus);
    setLoading(false);
  };

  return (
    <div>
      <DevToolsNav />
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Verify Contracts</h1>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <p className="text-gray-700">Network: {activeChain?.name || 'Unknown'}</p>
              <p className="text-gray-700 mt-1">
                {address ? `Connected as: ${address.substring(0, 8)}...${address.substring(address.length - 8)}` : 'Not connected'}
              </p>
            </div>
            {!address && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={connectWallet}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
        
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mb-6"
          onClick={verifyContracts}
          disabled={loading || !address}
        >
          {loading ? 'Verifying...' : 'Verify Contract Status'}
        </button>
        
        {errorMsg && (
          <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {errorMsg}
          </div>
        )}
        
        <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contractList.map((contract) => (
                <tr key={contract.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contract.id ? `${contract.id.substring(0, 8)}...${contract.id.substring(contract.id.length - 8)}` : 'Not Set'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {status[contract.name] ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        status[contract.name].includes('Error') 
                          ? 'bg-red-100 text-red-800' 
                          : status[contract.name].includes('Exists') 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status[contract.name]}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not checked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Troubleshooting Steps</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Make sure your contracts are properly deployed to the testnet</li>
            <li>Verify that the contract IDs in your .env file match the actually deployed contracts</li>
            <li>If using copied WASM files, ensure they have the proper interface for each contract type</li>
            <li>Consider re-deploying the contracts with proper initialization</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default VerifyContracts; 