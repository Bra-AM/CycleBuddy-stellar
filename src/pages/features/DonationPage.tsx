import { useState, useEffect } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import { 
  Box, 
  Button, 
  Flex, 
  FormControl, 
  FormLabel, 
  Heading, 
  Input, 
  Stack, 
  Text, 
  Divider,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import Layout from '../../components/layout/Layout';
import FeaturePageTemplate from '../../components/common/FeaturePageTemplate';
import { getSimulatedResponse } from '../../utils/contractHelper';

const DonationPage = () => {
  const { server, address } = useSorobanReact();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalDonations, setTotalDonations] = useState<number>(0);
  const [donationHistory, setDonationHistory] = useState<any[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const toast = useToast();
  
  const contractId = import.meta.env.VITE_DONATION_CONTRACT_ID;

  useEffect(() => {
    loadDonationData();
  }, [address, server]);

  const loadDonationData = async () => {
    if (!server || !address) return;
    
    try {
      // First check if the contract exists
      try {
        // Try to call a contract method to get total donations
        // For now we'll simulate this
        const simulated = getSimulatedResponse('donation_total');
        setTotalDonations(simulated);
        
        const historySimulated = getSimulatedResponse('donation_history');
        setDonationHistory(historySimulated);
        
        setIsSimulated(true);
      } catch (error) {
        console.error('Error loading donation data:', error);
        setIsSimulated(true);
        
        // Use simulated data as fallback
        setTotalDonations(getSimulatedResponse('donation_total'));
        setDonationHistory(getSimulatedResponse('donation_history'));
      }
    } catch (error) {
      console.error('Error in donation data loading:', error);
    }
  };

  const handleDonate = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid donation amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate donation process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update state with new donation
      const donationAmount = parseFloat(amount);
      setTotalDonations(prev => prev + donationAmount);
      
      const newDonation = {
        id: `sim-${Date.now()}`,
        amount: donationAmount,
        date: new Date().toISOString(),
        donor: address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Anonymous'
      };
      
      setDonationHistory(prev => [newDonation, ...prev]);
      
      toast({
        title: 'Donation successful!',
        description: `Thank you for your donation of ${amount} XLM!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setAmount('');
    } catch (error) {
      console.error('Error making donation:', error);
      toast({
        title: 'Donation failed',
        description: 'There was an error processing your donation. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const donationContent = (
    <Box>
      <Heading as="h1" size="xl" mb={6}>Support CycleBuddy</Heading>
      
      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        <Box flex="1">
          <Heading as="h2" size="md" mb={4}>Make a Donation</Heading>
          <Text mb={4}>
            Your donations help us maintain and improve the CycleBuddy platform. Every contribution counts!
          </Text>
          
          <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
            <Stack spacing={4}>
              <FormControl id="amount" isRequired>
                <FormLabel>Donation Amount (XLM)</FormLabel>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </FormControl>
              
              <Button 
                colorScheme="blue" 
                isLoading={loading}
                onClick={handleDonate}
              >
                Donate
              </Button>
            </Stack>
          </Box>
        </Box>
        
        <Box flex="1">
          <Heading as="h2" size="md" mb={4}>Donation Stats</Heading>
          
          <Box bg="white" p={6} borderRadius="md" boxShadow="sm" mb={6}>
            <Stat>
              <StatLabel>Total Donations</StatLabel>
              <StatNumber>{totalDonations.toFixed(2)} XLM</StatNumber>
              <StatHelpText>From our amazing community</StatHelpText>
            </Stat>
          </Box>
          
          <Heading as="h3" size="sm" mb={3}>Recent Donations</Heading>
          
          <TableContainer bg="white" borderRadius="md" boxShadow="sm">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Amount</Th>
                  <Th>Donor</Th>
                  <Th>Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {donationHistory.length === 0 ? (
                  <Tr>
                    <Td colSpan={3} textAlign="center">No donations yet</Td>
                  </Tr>
                ) : (
                  donationHistory.slice(0, 5).map((donation) => (
                    <Tr key={donation.id}>
                      <Td>{donation.amount.toFixed(2)} XLM</Td>
                      <Td>{donation.donor}</Td>
                      <Td>{new Date(donation.date).toLocaleDateString()}</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Flex>
    </Box>
  );

  return (
    <Layout>
      <FeaturePageTemplate 
        contractId={contractId}
        featureName="Donation"
        simulated={true} // Force simulation mode until contract is properly working
      >
        {donationContent}
      </FeaturePageTemplate>
    </Layout>
  );
};

export default DonationPage; 