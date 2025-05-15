import { useState, useEffect } from 'react';
import { useSorobanReact } from '@soroban-react/core';

const contracts = [
  'registry_contract.wasm',
  'cyclebuddy_auth_contract.wasm',
  'cyclebuddy_data_contract.wasm',
  'cyclebuddy_community_contract.wasm',
  'donation_contract.wasm',
  'data_sharing_contract.wasm',
  'rewards_contract.wasm',
  'zk_validation_contract.wasm',
  'data_marketplace_contract.wasm',
  'health_alerts_contract.wasm'
];

export function DeployContracts() {
  const { activeChain, address, connect } = useSorobanReact();
  const [status, setStatus] = useState<string>('');
  const [freighterAddress, setFreighterAddress] = useState<string | null>(null);

  // Check if Freighter is already connected on component mount
  useEffect(() => {
    async function checkConnection() {
      if (window.freighter) {
        try {
          const connected = await window.freighter.isConnected();
          if (connected) {
            const publicKey = await window.freighter.getPublicKey();
            setFreighterAddress(publicKey);
            console.log("Freighter already connected with address:", publicKey);
          }
        } catch (error) {
          console.error("Error checking Freighter connection:", error);
        }
      }
    }
    
    checkConnection();
  }, []);

  // Try connecting if address is not available but freighterAddress is
  useEffect(() => {
    if (!address && freighterAddress) {
      connect().catch(error => {
        console.error("Error connecting with Soroban React:", error);
      });
    }
  }, [address, freighterAddress, connect]);

  async function handleConnect() {
    try {
      // Try direct Freighter connection first
      if (window.freighter) {
        const connected = await window.freighter.isConnected();
        if (!connected) {
          // This will prompt the user to connect
          const publicKey = await window.freighter.getPublicKey();
          setFreighterAddress(publicKey);
          setStatus(`Connected with Freighter: ${publicKey}`);
          return;
        } else {
          const publicKey = await window.freighter.getPublicKey();
          setFreighterAddress(publicKey);
          setStatus(`Connected with Freighter: ${publicKey}`);
          return;
        }
      }
      
      // Fallback to Soroban React connect
      await connect();
      setStatus("Connected with Soroban React");
    } catch (error: any) {
      console.error("Connection error:", error);
      setStatus(`Error connecting: ${error?.message || 'Unknown error'}`);
    }
  }

  function getContractDownloadUrl(wasmName: string): string {
    return `/contracts/${wasmName}`;
  }

  // Use either the soroban address or direct freighter address
  const currentAddress = address || freighterAddress;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Deploy Contracts</h1>
      
      <div className="mb-4">
        <p>Connected Account: {currentAddress || 'Not Connected'}</p>
        <p>Network: {activeChain?.name || 'Testnet'}</p>
        
        {!currentAddress && (
          <button
            onClick={handleConnect}
            className="bg-green-500 text-white px-4 py-2 rounded mt-2"
          >
            Connect Wallet
          </button>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-100 p-4 rounded mb-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Deployment Instructions</h3>
        <p className="mb-2">To deploy the contracts, please follow these steps:</p>
        <ol className="list-decimal pl-6 mb-4">
          <li className="mb-2">Download each contract WASM file using the links below</li>
          <li className="mb-2">Use Stellar CLI to upload the contract to the network:</li>
          <code className="block bg-gray-800 text-white p-2 rounded mb-2 overflow-x-auto">
            stellar contract upload --wasm path/to/contract.wasm --source YOUR_SECRET_KEY --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"
          </code>
          <li>The command will return a WASM hash which you'll need for deploying the contracts</li>
          <li className="mb-2">Deploy the contract using the returned hash:</li>
          <code className="block bg-gray-800 text-white p-2 rounded mb-2 overflow-x-auto">
            stellar contract deploy --wasm-hash YOUR_WASM_HASH --source YOUR_SECRET_KEY --rpc-url https://soroban-testnet.stellar.org --network-passphrase "Test SDF Network ; September 2015"
          </code>
        </ol>
        <p className="text-sm text-yellow-700">Note: Deploy the contracts in the order listed below. Registry contract must be deployed first.</p>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Contract Files:</h2>
        {contracts.map((name) => (
          <div key={name} className="mb-3 flex items-center">
            <span className="font-medium">{name}</span>
            <a 
              href={getContractDownloadUrl(name)}
              download={name}
              className="ml-4 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Download
            </a>
          </div>
        ))}
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Status:</h2>
        <p>{status}</p>
      </div>
    </div>
  );
} 