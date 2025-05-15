import { useState, useEffect } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  Progress,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
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
  TableContainer,
  Center,
  Icon,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { FaMedal, FaRunning, FaChartLine, FaLeaf } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import FeaturePageTemplate from '../../components/common/FeaturePageTemplate';
import { getSimulatedResponse } from '../../utils/contractHelper';
import { passkeyService } from '../../services/auth/passkeyService';

const RewardsPage = () => {
  const { server, address } = useSorobanReact();
  const [pointsBalance, setPointsBalance] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [nextLevel, setNextLevel] = useState({ name: 'Silver', points: 100 });
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentRedemption, setCurrentRedemption] = useState<string | null>(null);
  
  const toast = useToast();
  const contractId = import.meta.env.VITE_REWARDS_CONTRACT_ID;
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadRewardsData();
  }, [address, server]);

  const loadRewardsData = async () => {
    if (!server || !address) return;
    
    try {
      // First check if the contract exists
      try {
        // Try to call a contract method to get rewards data
        // For now we'll simulate this
        const simulated = getSimulatedResponse('rewards_balance');
        setPointsBalance(simulated);
        
        const historySimulated = getSimulatedResponse('rewards_history');
        setPointsHistory(historySimulated);
        
        setIsSimulated(true);
      } catch (error) {
        console.error('Error loading rewards data:', error);
        setIsSimulated(true);
        
        // Use simulated data as fallback
        setPointsBalance(getSimulatedResponse('rewards_balance'));
        setPointsHistory(getSimulatedResponse('rewards_history'));
      }
      
      // Calculate next level based on points
      if (pointsBalance < 100) {
        setNextLevel({ name: 'Silver', points: 100 });
        setCurrentProgress(pointsBalance);
      } else if (pointsBalance < 250) {
        setNextLevel({ name: 'Gold', points: 250 });
        setCurrentProgress((pointsBalance - 100) / (250 - 100) * 100);
      } else if (pointsBalance < 500) {
        setNextLevel({ name: 'Platinum', points: 500 });
        setCurrentProgress((pointsBalance - 250) / (500 - 250) * 100);
      } else {
        setNextLevel({ name: 'Diamond', points: 1000 });
        setCurrentProgress((pointsBalance - 500) / (1000 - 500) * 100);
      }
    } catch (error) {
      console.error('Error in rewards data loading:', error);
    }
  };

  const getUserLevel = () => {
    if (pointsBalance >= 500) return 'Platinum';
    if (pointsBalance >= 250) return 'Gold';
    if (pointsBalance >= 100) return 'Silver';
    return 'Bronze';
  };

  const handleRedeemReward = async (reward: string, pointsRequired: number) => {
    setCurrentRedemption(reward);
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      // Request fingerprint authentication
      const authResult = await passkeyService.authenticateWithPasskey();
      
      if (!authResult.success) {
        throw new Error("Authentication failed");
      }
      
      // If authentication successful, proceed with redeeming the reward
      toast({
        title: 'Reward Redeemed',
        description: `You have successfully redeemed ${reward} for ${pointsRequired} points.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Simulate the update of points balance
      setPointsBalance(prev => prev - pointsRequired);
      
      // Add to history
      const newActivity = {
        id: Date.now().toString(),
        activity: `Redeemed ${reward}`,
        points: -pointsRequired,
        date: new Date().toISOString()
      };
      
      setPointsHistory(prev => [newActivity, ...prev]);
    } catch (error) {
      console.error('Error during authentication:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentRedemption(null);
    }
  };

  const rewardsContent = (
    <Box>
      <Heading as="h1" size="xl" mb={6}>Your Rewards Program</Heading>
      
      {authError && (
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardHeader pb={0}>
            <Heading size="md">Points Balance</Heading>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatNumber fontSize="3xl">{pointsBalance}</StatNumber>
              <StatHelpText>Lifetime earned points</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardHeader pb={0}>
            <Heading size="md">Your Level</Heading>
          </CardHeader>
          <CardBody>
            <Flex align="center">
              <Icon as={FaMedal} boxSize={8} mr={3} color={
                getUserLevel() === 'Bronze' ? 'orange.400' :
                getUserLevel() === 'Silver' ? 'gray.400' :
                getUserLevel() === 'Gold' ? 'yellow.400' : 'purple.400'
              } />
              <Box>
                <Text fontSize="2xl" fontWeight="bold">{getUserLevel()}</Text>
                <Text fontSize="sm">Member since 2023</Text>
              </Box>
            </Flex>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <CardHeader pb={0}>
            <Heading size="md">Next Level</Heading>
          </CardHeader>
          <CardBody>
            <Text fontSize="sm" mb={1}>Progress to {nextLevel.name} level</Text>
            <Progress value={currentProgress} colorScheme="blue" mb={2} borderRadius="md" />
            <Text fontSize="xs">{pointsBalance} / {nextLevel.points} points needed</Text>
          </CardBody>
        </Card>
      </SimpleGrid>
      
      <Box mb={8}>
        <Heading as="h2" size="md" mb={4}>Available Rewards</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
            <CardHeader bg="blue.50" pb={2}>
              <Flex align="center">
                <Icon as={FaLeaf} color="green.500" mr={2} />
                <Heading size="sm">Premium Features</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <Text mb={2}>Unlock premium app features for 30 days</Text>
              <Badge colorScheme="blue">100 points</Badge>
            </CardBody>
            <CardFooter pt={0}>
              <Button 
                colorScheme="blue" 
                size="sm" 
                isDisabled={pointsBalance < 100 || isAuthenticating}
                isLoading={isAuthenticating && currentRedemption === 'Premium Features'}
                loadingText="Authenticating..."
                onClick={() => handleRedeemReward('Premium Features', 100)}
              >
                Redeem
              </Button>
            </CardFooter>
          </Card>
          
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
            <CardHeader bg="blue.50" pb={2}>
              <Flex align="center">
                <Icon as={FaRunning} color="orange.500" mr={2} />
                <Heading size="sm">Fitness Tracker</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <Text mb={2}>Discount coupon for fitness tracker device</Text>
              <Badge colorScheme="blue">250 points</Badge>
            </CardBody>
            <CardFooter pt={0}>
              <Button 
                colorScheme="blue" 
                size="sm" 
                isDisabled={pointsBalance < 250 || isAuthenticating}
                isLoading={isAuthenticating && currentRedemption === 'Fitness Tracker'}
                loadingText="Authenticating..."
                onClick={() => handleRedeemReward('Fitness Tracker', 250)}
              >
                Redeem
              </Button>
            </CardFooter>
          </Card>
          
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
            <CardHeader bg="blue.50" pb={2}>
              <Flex align="center">
                <Icon as={FaChartLine} color="purple.500" mr={2} />
                <Heading size="sm">Health Analysis</Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              <Text mb={2}>Professional health analysis consultation</Text>
              <Badge colorScheme="blue">500 points</Badge>
            </CardBody>
            <CardFooter pt={0}>
              <Button 
                colorScheme="blue" 
                size="sm" 
                isDisabled={pointsBalance < 500 || isAuthenticating}
                isLoading={isAuthenticating && currentRedemption === 'Health Analysis'}
                loadingText="Authenticating..."
                onClick={() => handleRedeemReward('Health Analysis', 500)}
              >
                Redeem
              </Button>
            </CardFooter>
          </Card>
        </SimpleGrid>
      </Box>
      
      <Box>
        <Heading as="h2" size="md" mb={4}>Points Activity</Heading>
        <TableContainer bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="md" boxShadow="sm">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Activity</Th>
                <Th isNumeric>Points</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pointsHistory.length === 0 ? (
                <Tr>
                  <Td colSpan={3}>
                    <Center p={4}>No activity recorded yet</Center>
                  </Td>
                </Tr>
              ) : (
                pointsHistory.map((item) => (
                  <Tr key={item.id}>
                    <Td>{item.activity}</Td>
                    <Td isNumeric>{item.points > 0 ? `+${item.points}` : item.points}</Td>
                    <Td>{new Date(item.date).toLocaleDateString()}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
  
  return (
    <Layout>
      <FeaturePageTemplate 
        contractId={contractId}
        featureName="Rewards"
        simulated={true} // Force simulation mode until contract is properly working
      >
        {rewardsContent}
      </FeaturePageTemplate>
    </Layout>
  );
};

export default RewardsPage; 