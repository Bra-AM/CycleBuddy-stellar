import React, { useState, useEffect } from 'react';
import { stellarContractService } from '../services/stellar/contractService';

const ContractTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Check if Freighter wallet is available
        try {
          // Check if freighter exists
          if (typeof window.freighter === 'undefined') {
            setIsFreighterAvailable(false);
            setError('Freighter wallet extension is not installed. Using simulated mode.');
          }
        } catch (err) {
          setIsFreighterAvailable(false);
          setError('Freighter wallet extension is not installed. Using simulated mode.');
        }

        // Initialize the contract service
        const success = await stellarContractService.initialize();
        console.log('Initialization success:', success);
        
        // Check if wallet is connected
        const connected = await stellarContractService.isWalletConnected();
        setIsConnected(connected);
        
        if (connected) {
          const key = await stellarContractService.getUserPublicKey();
          setPublicKey(key);
        }
      } catch (err) {
        console.error('Error initializing contract service:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    
    init();
  }, []);

  const handleConnect = async () => {
    try {
      setError(null);
      const connected = await stellarContractService.connectWallet();
      setIsConnected(connected);
      
      if (connected) {
        const key = await stellarContractService.getUserPublicKey();
        setPublicKey(key);
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Stellar Contract Test</h2>
      
      {error && (
        <div className={`border px-4 py-3 rounded mb-4 ${isFreighterAvailable ? 'bg-red-100 border-red-400 text-red-700' : 'bg-yellow-100 border-yellow-400 text-yellow-700'}`}>
          <p><strong>{isFreighterAvailable ? 'Error:' : 'Note:'}</strong> {error}</p>
        </div>
      )}
      
      {!isFreighterAvailable && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <p><strong>Simulated Mode:</strong> Using mock data since Freighter wallet is not available.</p>
          <p className="text-sm mt-1">To use real wallet functionality, please install the Freighter browser extension.</p>
          <a 
            href="https://www.freighter.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mt-2 text-blue-600 hover:underline"
          >
            Get Freighter Wallet
          </a>
        </div>
      )}
      
      <div className="mb-4">
        <p className="font-semibold">Wallet Connection Status:</p>
        <p className={isConnected ? "text-green-600" : "text-red-600"}>
          {isConnected ? "Connected" : "Not Connected"}
        </p>
      </div>
      
      {publicKey && (
        <div className="mb-4">
          <p className="font-semibold">Public Key:</p>
          <p className="break-all text-sm bg-gray-100 p-2 rounded">{publicKey}</p>
          {!isFreighterAvailable && (
            <p className="text-xs text-gray-500 mt-1">(This is a simulated public key)</p>
          )}
        </div>
      )}
      
      {!isConnected && (
        <button 
          onClick={handleConnect}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isFreighterAvailable ? "Connect Wallet" : "Simulate Wallet Connection"}
        </button>
      )}
    </div>
  );
};

export default ContractTest; 