import { ReactNode, useState, useEffect } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { Box, Alert, AlertIcon, Button, Container, Center, Spinner, Text } from '@chakra-ui/react';
import { checkFeatureAvailability, FeatureStatus } from '../../utils/contractHelper';

interface FeaturePageTemplateProps {
  contractId: string;
  featureName: string;
  children: ReactNode;
  simulated?: boolean;
}

const FeaturePageTemplate = ({ 
  contractId, 
  featureName, 
  children,
  simulated = false 
}: FeaturePageTemplateProps) => {
  const { server, address, connect } = useSorobanReact();
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      if (simulated) {
        setFeatureStatus({
          isAvailable: true,
          contractId: null,
          simulationMode: true
        });
        setLoading(false);
        return;
      }

      try {
        if (server) {
          const status = await checkFeatureAvailability(server, contractId, featureName);
          setFeatureStatus(status);
        } else {
          setFeatureStatus({
            isAvailable: false,
            contractId: null,
            errorMessage: 'Soroban server not available'
          });
        }
      } catch (error) {
        console.error('Error checking feature availability:', error);
        setFeatureStatus({
          isAvailable: false,
          contractId: null,
          errorMessage: 'An error occurred checking feature availability'
        });
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [server, contractId, featureName, simulated]);

  const handleConnect = async () => {
    if (connect) {
      try {
        await connect();
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  if (loading) {
    return (
      <Center h="300px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!address) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="warning" mb={6}>
          <AlertIcon />
          Please connect your wallet to use this feature
        </Alert>
        <Button colorScheme="blue" onClick={handleConnect}>
          Connect Wallet
        </Button>
      </Container>
    );
  }

  if (!featureStatus?.isAvailable && !simulated) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="error" mb={6}>
          <AlertIcon />
          {featureStatus?.errorMessage || `The ${featureName} feature is not available at this time.`}
        </Alert>
        <Box bg="gray.50" p={6} borderRadius="md">
          <Text fontWeight="bold" mb={4}>Troubleshooting:</Text>
          <Text>1. The contract may not be deployed properly</Text>
          <Text>2. The contract ID in the .env file might be incorrect</Text>
          <Text>3. The contract might not be initialized</Text>
          <Text>4. You might be connected to the wrong network</Text>
          <Box mt={4}>
            <Text fontWeight="bold">Current contract ID:</Text>
            <Text fontFamily="monospace">{contractId || 'Not set'}</Text>
          </Box>
        </Box>
      </Container>
    );
  }

  if (featureStatus?.simulationMode) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="info" mb={6}>
          <AlertIcon />
          Using simulated data for {featureName} feature. Contract interactions are not available.
        </Alert>
        {children}
      </Container>
    );
  }

  return <Container maxW="container.lg" py={8}>{children}</Container>;
};

export default FeaturePageTemplate; 