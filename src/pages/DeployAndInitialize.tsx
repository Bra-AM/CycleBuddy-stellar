import { useState } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { SorobanRpc } from '@stellar/stellar-sdk';
import freighter from '@stellar/freighter-api';
import DevToolsNav from '../components/common/DevToolsNav';

export function DeployAndInitialize() {
  const { activeChain, server, address, connect } = useSorobanReact();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, message]);
  };

  const connectWallet = async () => {
    try {
      if (connect) {
        await connect();
        addLog('✅ Wallet connected!');
      }
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setErrorMsg('Failed to connect wallet: ' + (err.message || ''));
      addLog('❌ Wallet connection failed.');
    }
  };

  const deployAndInitialize = async () => {
    if (!server || !address) {
      setErrorMsg('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    
    try {
      addLog('Starting deployment process...');
      addLog(`Connected as: ${address}`);
      addLog(`Network: ${activeChain?.name || 'Unknown'}`);
      
      // This is just a simplified guide - actual deployment requires soroban-cli
      // and contract WASM files. This UI is mainly to help understand the process.
      
      addLog('');
      addLog('📋 Deployment Instructions:');
      addLog('1. Make sure you have soroban-cli installed');
      addLog('2. Verify your wallet has sufficient XLM (testnet)');
      addLog('3. Run the following commands in your terminal:');
      
      addLog('');
      addLog('# Deploy Registry Contract:');
      addLog('soroban contract deploy --wasm path/to/registry.wasm --source YOUR_KEY --network testnet');
      
      addLog('');
      addLog('# Deploy Auth Contract:');
      addLog('soroban contract deploy --wasm path/to/auth.wasm --source YOUR_KEY --network testnet');
      
      addLog('');
      addLog('# Deploy Data Contract:');
      addLog('soroban contract deploy --wasm path/to/data.wasm --source YOUR_KEY --network testnet');
      
      addLog('');
      addLog('# Initialize Registry Contract (replace with actual contract IDs):');
      addLog('soroban contract invoke --id REGISTRY_CONTRACT_ID --source YOUR_KEY --network testnet -- initialize --admin YOUR_ADDRESS --auth_contract AUTH_CONTRACT_ID --data_contract DATA_CONTRACT_ID');
      
      addLog('');
      addLog('# Initialize Auth Contract:');
      addLog('soroban contract invoke --id AUTH_CONTRACT_ID --source YOUR_KEY --network testnet -- initialize --admin YOUR_ADDRESS --registry_contract REGISTRY_CONTRACT_ID');
      
      addLog('');
      addLog('# Initialize Data Contract:');
      addLog('soroban contract invoke --id DATA_CONTRACT_ID --source YOUR_KEY --network testnet -- initialize --admin YOUR_ADDRESS --registry_contract REGISTRY_CONTRACT_ID');
      
      addLog('');
      addLog('4. After deployment, update your .env file with the contract IDs');
      
    } catch (err: any) {
      console.error('Error:', err);
      setErrorMsg('Error: ' + (err.message || 'Unknown error'));
      addLog('❌ Error occurred during process.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <DevToolsNav />
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Deploy and Initialize Contracts</h1>
        
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
        
        <div className="mb-6">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            onClick={deployAndInitialize}
            disabled={loading || !address}
          >
            {loading ? 'Processing...' : 'Show Deployment Instructions'}
          </button>
        </div>
        
        {errorMsg && (
          <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {errorMsg}
          </div>
        )}
        
        {logs.length > 0 && (
          <div className="p-4 bg-black text-green-400 font-mono rounded-lg text-sm overflow-auto max-h-[600px]">
            {logs.map((log, index) => (
              <div key={index} className={log.startsWith('#') ? 'text-gray-500 mt-2' : ''}>
                {log}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Important Notes</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Contract deployment requires proper WASM files, not placeholders</li>
            <li>After deployment, contracts must be properly initialized with their dependencies</li>
            <li>When updating your .env file, restart the development server for changes to take effect</li>
            <li>Test each contract using the Verify Contracts page after deployment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DeployAndInitialize; 