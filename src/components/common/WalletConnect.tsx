import { useState } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { Box, Button, Text, Alert, AlertIcon } from '@chakra-ui/react';

interface WalletConnectProps {
  onConnect?: () => void;
  promptText?: string;
}

const WalletConnect = ({ onConnect, promptText = 'Connect your wallet to continue' }: WalletConnectProps) => {
  const { address, connect } = useSorobanReact();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!connect) {
      setError('Wallet connection not available');
      return;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      await connect();
      if (onConnect) onConnect();
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  if (address) {
    return (
      <Box p={2} borderRadius="md" bg="blue.50">
        <Text fontSize="sm">Connected as: {address.slice(0, 8)}...{address.slice(-8)}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text mb={2}>{promptText}</Text>
      <Button 
        colorScheme="blue" 
        onClick={handleConnect} 
        isLoading={connecting}
        loadingText="Connecting..."
      >
        Connect Wallet
      </Button>
      
      {error && (
        <Alert status="error" mt={2}>
          <AlertIcon />
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default WalletConnect; 