import { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  useToast,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Tag,
  Badge,
  Progress,
  Divider,
  SimpleGrid,
  useColorModeValue,
  List,
  ListItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Image,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Checkbox,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Icon,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { useAuthStore } from '../../services/auth/authService';
import { keyframes } from '@emotion/react';
import { passkeyService } from '../../services/auth/passkeyService';
import { stellarContractService } from '../../services/stellar/contractService';
import { 
  FaHome, 
  FaBrain, 
  FaGraduationCap, 
  FaFlask, 
  FaLock, 
  FaCheckCircle, 
  FaCertificate, 
  FaMedal, 
  FaShieldAlt, 
  FaMoneyBillWave, 
  FaChartLine,
  FaUniversity,
  FaClock,
  FaExclamationTriangle,
  FaBell,
  FaInfoCircle,
  FaCheck
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Create a keyframe animation for the gradient
const animatedGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Mock data
const recentCycleData = [
  { day: 1, mood: 'Good', symptoms: ['Cramps', 'Fatigue'], date: '2025-09-01' },
  { day: 2, mood: 'Fair', symptoms: ['Bloating'], date: '2025-09-02' },
  { day: 3, mood: 'Great', symptoms: [], date: '2025-09-03' },
];

// Information cards data
const infoCards = [
  {
    title: 'Cycle Health Tips',
    content: 'Regular exercise can help reduce menstrual pain and improve mood.',
    emoji: '📈',
  },
  {
    title: 'Did You Know?',
    content: 'The average menstrual cycle is 28 days, but anywhere from 21 to 35 days is considered normal.',
    emoji: '📅',
  },
  {
    title: 'Community Highlight',
    content: 'Join our discussion on natural remedies for menstrual discomfort.',
    emoji: '👥',
  },
];

// Stellar blockchain features
const blockchainFeatures = [
  { 
    title: 'Passkey Authentication',
    description: 'Your account is secured with Stellar Passkeys, a modern authentication method more secure than passwords.',
    emoji: '🔒'
  },
  { 
    title: 'Encrypted Data Storage',
    description: 'Your health data is encrypted and stored on the Stellar blockchain for maximum privacy and security.',
    emoji: '🔐'
  },
  { 
    title: 'Decentralized Identity',
    description: 'Your identity is protected through Stellar\'s decentralized authentication, giving you full control.',
    emoji: '🛡️'
  },
];

// Advanced Stellar features
const advancedFeatures = [
  {
    title: 'Donate to Research',
    description: 'Support menstrual health research initiatives using Stellar\'s path payment feature. Donate in any currency, automatically converted to the recipient\'s preferred currency.',
    emoji: '💰',
    modalType: 'donation',
  },
  {
    title: 'Share Health Data',
    description: 'Securely share your health data with medical professionals using time-limited multi-signature authorization that automatically expires.',
    emoji: '🔄',
    modalType: 'dataSharing',
  },
  {
    title: 'Earn Rewards',
    description: 'Earn rewards for consistent tracking and completing educational modules. Rewards are distributed through Stellar\'s claimable balances.',
    emoji: '🏆',
    modalType: 'rewards',
  },
  {
    title: 'Private Data Validation',
    description: 'Validate health metrics without revealing sensitive data through zero-knowledge proofs on the Stellar network.',
    emoji: '✅',
    modalType: 'zkValidation',
  },
  {
    title: 'Monetize Your Data',
    description: 'Anonymously contribute to research data pools with transparent revenue sharing through Stellar\'s trustless payment system.',
    emoji: '📊',
    modalType: 'dataMarketplace',
  },
  {
    title: 'Health Alerts',
    description: 'Receive automated health alerts for concerning patterns through Stellar Turrets, without compromising your privacy.',
    emoji: '⚠️',
    modalType: 'healthAlerts',
  },
];

// Add this in the advancedFeatures array after the existing items
const breakthroughFeatures = [
  {
    title: 'AI-Powered Health Insights',
    description: 'Get personalized health insights from advanced machine learning algorithms that analyze your encrypted data while maintaining privacy.',
    emoji: '🧠',
    tabValue: 'ai-health-insights',
    color: 'purple',
  },
  {
    title: 'NFT-Based Educational Achievement',
    description: 'Earn verified NFT credentials by completing educational modules on menstrual and reproductive health.',
    emoji: '🎓',
    tabValue: 'nft-education',
    color: 'teal',
  },
  {
    title: 'Research Contribution Marketplace',
    description: 'Contribute anonymized health data to research projects of your choice and receive fair compensation.',
    emoji: '🔬',
    tabValue: 'research-marketplace',
    color: 'blue',
  },
];

export const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [cycleData] = useState(recentCycleData);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeFeature, setActiveFeature] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [xlmBalance, setXlmBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Animated card style
  const cardGradient = useColorModeValue(
    'linear(to-r, #8A2BE2, #D53F8C)',
    'linear(to-r, #8A2BE2, #D53F8C)'
  );
  
  // Button style
  const animatedGradientStyle = {
    bgGradient: 'linear(to-r, #8A2BE2, #D53F8C, #8A2BE2)',
    bgSize: '200% 100%',
    animation: `${animatedGradient} 3s ease infinite`,
    color: 'white',
    _hover: {
      bgGradient: 'linear(to-r, #8A2BE2, #D53F8C, #8A2BE2)',
      bgSize: '200% 100%',
      animation: `${animatedGradient} 2s ease infinite`,
    }
  };

  // Load user data including XLM balance
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingBalance(true);
        const balance = await stellarContractService.getXLMBalance();
        setXlmBalance(balance);
      } catch (error) {
        console.error('Error loading XLM balance:', error);
        // Use a fallback balance
        setXlmBalance(0);
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    loadData();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Open feature modal
  const openFeatureModal = (feature: any) => {
    setActiveFeature(feature);
    onOpen();
  };

  // Simulate fetching data
  useEffect(() => {
    // This would be an actual API call in a real application
    const loadData = async () => {
      // Actual data fetching would happen here
    };
    
    loadData();
  }, []);
  
  const handleDonate = async () => {
    setCurrentAction('donate');
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error("Authentication failed for donation");
      }
      
      // Get values from form
      const initiativeSelect = document.querySelector('select[placeholder="Select initiative"]') as HTMLSelectElement;
      const amountInput = document.querySelector('input[placeholder="Amount"]') as HTMLInputElement;
      const currencySelect = document.querySelector('select[placeholder="Select currency"]') as HTMLSelectElement;
      
      const initiativeId = initiativeSelect?.value || 'research1';
      const amount = amountInput?.value ? parseFloat(amountInput.value) : 10;
      const currency = currencySelect?.value || 'XLM';
      
      // Use the Stellar-specific donation implementation
      const success = await stellarContractService.makeDonation(amount, initiativeId, currency);
      
      if (success) {
        toast({
          title: 'Donation Successful',
          description: 'Thank you for your contribution!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        
        // Refresh the XLM balance
        const balance = await stellarContractService.getXLMBalance();
        setXlmBalance(balance);
      } else {
        throw new Error("Failed to complete donation");
      }
    } catch (error) {
      console.error('Error during donation authentication:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleClaimRewards = async () => {
    setCurrentAction('claimRewards');
    setIsAuthenticating(true);
    setAuthError(null);
    
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      
      if (!authResult.success) {
        throw new Error("Authentication failed");
      }
      
      // Use the Stellar-specific rewards claiming implementation
      const success = await stellarContractService.claimRewards();
      
      if (success) {
        toast({
          title: 'Rewards Claimed',
          description: `25 XLM has been added to your wallet!`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh the XLM balance
        const balance = await stellarContractService.getXLMBalance();
        setXlmBalance(balance);
        
        onClose();
      } else {
        throw new Error("Failed to claim rewards");
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleCreateSecureShare = async () => {
    setCurrentAction('dataSharing');
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error("Authentication failed for data sharing");
      }
      
      // Get values from form
      const recipientInput = document.querySelector('input[placeholder="Healthcare provider\'s Stellar address or email"]') as HTMLInputElement;
      const dataCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
      const durationSelect = document.querySelector('select[placeholder="Select duration"]') as HTMLSelectElement;
      
      const recipientAddress = recipientInput?.value || 'example@healthcare.org';
      const dataTypes = Array.from(dataCheckboxes).map(cb => cb.parentElement?.textContent?.trim() || '');
      
      // Convert duration to hours
      let durationHours = 24; // default
      if (durationSelect?.value === '1week') {
        durationHours = 24 * 7;
      } else if (durationSelect?.value === '1month') {
        durationHours = 24 * 30;
      }
      
      // Use the Stellar-specific data sharing implementation
      const success = await stellarContractService.shareHealthData(recipientAddress, dataTypes, durationHours);
      
      if (success) {
        toast({
          title: 'Secure Share Created',
          description: 'Your health data has been securely shared.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error("Failed to share data");
      }
    } catch (error) {
      console.error('Error during data sharing authentication:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleValidationAction = async (actionName: string) => {
    setCurrentAction(actionName);
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error(`Authentication failed for ${actionName}`);
      }
      
      let validationType = '';
      if (actionName === 'zk-validate-symptom') {
        validationType = 'symptoms';
      } else if (actionName === 'zk-create-validation') {
        // Get the selected validation type
        const validationSelect = document.querySelector('select[placeholder="Select validation type"]') as HTMLSelectElement;
        validationType = validationSelect?.value || 'cycle';
      }
      
      // Use the Stellar-specific ZK validation implementation
      const success = await stellarContractService.validateDataWithZKP(validationType);
      
      if (success) {
        toast({
          title: 'Validation Processed',
          description: `Your request for ${actionName.replace('zk-', '')} has been processed.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error("Failed to process validation");
      }
    } catch (error) {
      console.error(`Error during ${actionName} authentication:`, error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleDataMarketplaceAction = async (actionName: string) => {
    setCurrentAction(actionName);
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error(`Authentication failed for ${actionName}`);
      }
      
      let success = false;
      
      if (actionName === 'market-contribute') {
        // Get the selected pool and data types
        const poolSelect = document.querySelector('select[placeholder="Select research pool"]') as HTMLSelectElement;
        const poolId = poolSelect?.value || 'cycle';
        const dataTypes = [poolId]; // In a real app, we'd have specific data types
        
        // Use the Stellar-specific data contribution implementation
        success = await stellarContractService.contributeDataToMarketplace(poolId, dataTypes);
      } else if (actionName === 'market-claim') {
        // Use the Stellar-specific earnings claiming implementation
        success = await stellarContractService.claimDataMarketplaceEarnings();
        
        if (success) {
          // Refresh the XLM balance
          const balance = await stellarContractService.getXLMBalance();
          setXlmBalance(balance);
        }
      }
      
      if (success) {
        let title = 'Action Processed';
        let description = `Your request for ${actionName.replace('market-', '')} has been processed.`;
        
        if (actionName === 'market-contribute') {
          title = 'Data Contribution Successful';
          description = 'Your anonymized data has been contributed.';
        } else if (actionName === 'market-claim') {
          title = 'Earnings Claimed';
          description = 'Your earnings have been added to your wallet.';
        }
        
        toast({
          title,
          description,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error(`Failed to process ${actionName}`);
      }
    } catch (error) {
      console.error(`Error during ${actionName} authentication:`, error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  const handleSaveHealthAlertSettings = async () => {
    setCurrentAction('healthAlerts');
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const authResult = await passkeyService.authenticateWithPasskey();
      if (!authResult.success) {
        throw new Error("Authentication failed for saving health alert settings");
      }
      
      // Get the checked alert types and notification channels
      const alertCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
      
      const alertTypes: string[] = [];
      const notificationChannels: string[] = [];
      
      // Separate alert types from notification channels
      alertCheckboxes.forEach(cb => {
        const text = cb.parentElement?.textContent?.trim() || '';
        if (['Irregular Cycle Detection', 'Unusual Symptom Patterns', 'Medication Reminders', 'Health Check Reminders'].includes(text)) {
          alertTypes.push(text);
        } else if (['In-App', 'Email', 'Push Notification'].includes(text)) {
          notificationChannels.push(text);
        }
      });
      
      // Use the Stellar-specific health alerts implementation
      const success = await stellarContractService.configureHealthAlerts(alertTypes, notificationChannels);
      
      if (success) {
        toast({
          title: 'Settings Saved',
          description: 'Your health alert settings have been updated.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } else {
        throw new Error("Failed to save health alert settings");
      }
    } catch (error) {
      console.error('Error during health alert settings authentication:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
      setCurrentAction(null);
    }
  };

  // Modal content based on feature type
  const renderModalContent = () => {
    if (!activeFeature) return null;
    
    switch (activeFeature.modalType) {
      case 'donation':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Donate to Research</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Support menstrual health research initiatives with Stellar's path payment feature.</Text>
                <FormControl>
                  <FormLabel>Initiative</FormLabel>
                  <Select placeholder="Select initiative">
                    <option value="research1">Women's Health Research Fund</option>
                    <option value="research2">Menstrual Equity Initiative</option>
                    <option value="research3">Global Period Poverty Program</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Donation Amount</FormLabel>
                  <Input type="number" placeholder="Amount" />
                </FormControl>
                <FormControl>
                  <FormLabel>Donation Currency</FormLabel>
                  <Select placeholder="Select currency">
                    <option value="xlm">XLM (Stellar Lumens)</option>
                    <option value="usdc">USDC</option>
                    <option value="btc">BTC</option>
                  </Select>
                </FormControl>
                {authError && currentAction === 'donate' && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                sx={animatedGradientStyle} 
                mr={3} 
                onClick={handleDonate}
                isLoading={isAuthenticating && currentAction === 'donate'}
                loadingText="Authenticating..."
              >
                Donate Now
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </>
        );
        
      case 'dataSharing':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Share Health Data</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Share your health data securely with time-limited access control.</Text>
                <FormControl>
                  <FormLabel>Share With</FormLabel>
                  <Input placeholder="Healthcare provider's Stellar address or email" />
                </FormControl>
                <FormControl>
                  <FormLabel>Data to Share</FormLabel>
                  <VStack align="start">
                    <Checkbox>Cycle Data</Checkbox>
                    <Checkbox>Symptom History</Checkbox>
                    <Checkbox>Medication Records</Checkbox>
                  </VStack>
                </FormControl>
                <FormControl>
                  <FormLabel>Access Duration</FormLabel>
                  <Select placeholder="Select duration">
                    <option value="1day">24 hours</option>
                    <option value="1week">1 week</option>
                    <option value="1month">1 month</option>
                  </Select>
                </FormControl>
                {authError && currentAction === 'dataSharing' && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                sx={animatedGradientStyle} 
                mr={3} 
                onClick={handleCreateSecureShare}
                isLoading={isAuthenticating && currentAction === 'dataSharing'}
                loadingText="Authenticating..."
              >
                Create Secure Share
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </>
        );
        
      case 'rewards':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Rewards Program</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Stat>
                  <StatLabel>Available Rewards</StatLabel>
                  <StatNumber>25 XLM</StatNumber>
                  <StatHelpText>Earned from consistent tracking</StatHelpText>
                </Stat>
                <Divider />
                <Text fontWeight="bold">Completed Achievements</Text>
                <HStack>
                  <Badge colorScheme="green">First Entry</Badge>
                  <Badge colorScheme="purple">7-Day Streak</Badge>
                  <Badge colorScheme="blue">Educational Quiz</Badge>
                </HStack>
                <Divider />
                <Text fontWeight="bold">Next Achievements</Text>
                <VStack align="start">
                  <HStack>
                    <Text>30-Day Tracking Streak</Text>
                    <Progress value={70} size="sm" colorScheme="purple" borderRadius="full" flex="1" />
                    <Text>+50 XLM</Text>
                  </HStack>
                  <HStack>
                    <Text>Complete Health Course</Text>
                    <Progress value={40} size="sm" colorScheme="purple" borderRadius="full" flex="1" />
                    <Text>+30 XLM</Text>
                  </HStack>
                </VStack>
                
                {authError && currentAction === 'claimRewards' && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                sx={animatedGradientStyle} 
                mr={3} 
                onClick={handleClaimRewards}
                isLoading={isAuthenticating && currentAction === 'claimRewards'}
                loadingText="Authenticating..."
              >
                Claim Rewards
              </Button>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </ModalFooter>
          </>
        );
      
      case 'zkValidation':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Private Data Validation</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Validate health metrics without revealing sensitive information using zero-knowledge proofs.</Text>
                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Available Validations:</Text>
                  <List spacing={2}>
                    <ListItem>
                      <HStack justifyContent="space-between">
                        <Text>Cycle Length (Normal Range)</Text>
                        <Badge colorScheme="green">Validated</Badge>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack justifyContent="space-between">
                        <Text>Regular Tracking (Last 30 Days)</Text>
                        <Badge colorScheme="green">Validated</Badge>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack justifyContent="space-between">
                        <Text>Symptom Pattern Analysis</Text>
                        <Button 
                          size="xs" 
                          sx={animatedGradientStyle}
                          onClick={() => handleValidationAction('zk-validate-symptom')}
                          isLoading={isAuthenticating && currentAction === 'zk-validate-symptom'}
                          loadingText="Auth..."
                        >
                          Validate Now
                        </Button>
                      </HStack>
                    </ListItem>
                  </List>
                </Box>
                <Divider />
                <Text fontWeight="bold">Request New Validation</Text>
                <FormControl>
                  <FormLabel>Validation Type</FormLabel>
                  <Select placeholder="Select validation type">
                    <option value="cycle">Cycle Length Validation</option>
                    <option value="tracking">Tracking Consistency</option>
                    <option value="symptoms">Symptom Pattern Analysis</option>
                  </Select>
                </FormControl>
                {authError && currentAction?.startsWith('zk-') && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                sx={animatedGradientStyle} 
                mr={3}
                onClick={() => handleValidationAction('zk-create-validation')}
                isLoading={isAuthenticating && currentAction === 'zk-create-validation'}
                loadingText="Authenticating..."
              >
                Create Validation
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </>
        );
        
      case 'dataMarketplace':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Data Marketplace</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Contribute anonymized data to research pools and earn rewards through Stellar's revenue sharing.</Text>
                <Tabs variant="soft-rounded" colorScheme="purple" isFitted>
                  <TabList>
                    <Tab>Contribute Data</Tab>
                    <Tab>Your Earnings</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel px={0}>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Research Pool</FormLabel>
                          <Select placeholder="Select research pool">
                            <option value="cycle">Menstrual Cycle Research</option>
                            <option value="symptoms">Symptom Correlation Study</option>
                            <option value="wellness">Wellness & Lifestyle Impact</option>
                          </Select>
                        </FormControl>
                        <Text fontSize="sm">
                          By contributing, you'll share anonymized data with researchers while maintaining privacy through zero-knowledge proofs.
                        </Text>
                        <Button 
                          sx={animatedGradientStyle}
                          onClick={() => handleDataMarketplaceAction('market-contribute')}
                          isLoading={isAuthenticating && currentAction === 'market-contribute'}
                          loadingText="Authenticating..."
                        >
                          Contribute Data
                        </Button>
                      </VStack>
                    </TabPanel>
                    <TabPanel px={0}>
                      <Stat mb={4}>
                        <StatLabel>Total Earnings</StatLabel>
                        <StatNumber>12.5 XLM</StatNumber>
                        <StatHelpText>From 3 research contributions</StatHelpText>
                      </Stat>
                      <Button 
                        sx={animatedGradientStyle} 
                        size="sm"
                        onClick={() => handleDataMarketplaceAction('market-claim')}
                        isLoading={isAuthenticating && currentAction === 'market-claim'}
                        loadingText="Authenticating..."
                      >
                        Claim Earnings
                      </Button>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                {authError && currentAction?.startsWith('market-') && (
                  <Alert status="error" borderRadius="md" mt={4}>
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </ModalFooter>
          </>
        );
        
      case 'healthAlerts':
        return (
          <>
            <ModalHeader bgGradient={cardGradient} bgClip="text">Health Alerts</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>Configure automated health alerts powered by Stellar Turrets that can monitor patterns while preserving privacy.</Text>
                <FormControl>
                  <FormLabel>Alert Types</FormLabel>
                  <VStack align="start">
                    <Checkbox defaultChecked>Irregular Cycle Detection</Checkbox>
                    <Checkbox defaultChecked>Unusual Symptom Patterns</Checkbox>
                    <Checkbox defaultChecked>Medication Reminders</Checkbox>
                    <Checkbox>Health Check Reminders</Checkbox>
                  </VStack>
                </FormControl>
                <FormControl>
                  <FormLabel>Notification Channels</FormLabel>
                  <VStack align="start">
                    <Checkbox defaultChecked>In-App</Checkbox>
                    <Checkbox>Email</Checkbox>
                    <Checkbox>Push Notification</Checkbox>
                  </VStack>
                </FormControl>
                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>Active Alerts:</Text>
                  <List spacing={2}>
                    <ListItem>
                      <HStack>
                        <Badge colorScheme="purple">Active</Badge>
                        <Text>Cycle Length Monitoring</Text>
                      </HStack>
                    </ListItem>
                    <ListItem>
                      <HStack>
                        <Badge colorScheme="purple">Active</Badge>
                        <Text>Symptom Pattern Analysis</Text>
                      </HStack>
                    </ListItem>
                  </List>
                </Box>
                {authError && currentAction === 'healthAlerts' && (
                  <Alert status="error" borderRadius="md" mt={4}>
                    <AlertIcon />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button 
                sx={animatedGradientStyle} 
                mr={3}
                onClick={handleSaveHealthAlertSettings}
                isLoading={isAuthenticating && currentAction === 'healthAlerts'}
                loadingText="Authenticating..."
              >
                Save Settings
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Box>
          <Heading as="h1" size="xl" bgGradient={cardGradient} bgClip="text">
            Welcome, {user?.username || 'User'}
          </Heading>
          <Text color="gray.600">your secure menstrual health companion</Text>
        </Box>
        <HStack>
          <Stat textAlign="right" mr={4}>
            <StatLabel>Wallet Balance</StatLabel>
            <StatNumber fontSize="lg">
              {isLoadingBalance ? (
                <Spinner size="sm" color="purple.500" mr={2} />
              ) : (
                `${xlmBalance?.toFixed(2) || '0.00'} XLM`
              )}
            </StatNumber>
          </Stat>
          <Badge colorScheme="purple" fontSize="0.8em" p={2} borderRadius="full">
            Secured with Stellar Blockchain
          </Badge>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label='User menu'
              icon={<Avatar size="sm" name={user?.username || 'User'} bg="#D53F8C" />}
              variant="ghost"
            />
            <MenuList>
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
      
      {/* Navigation Bar */}
      <Box
        py={2}
        px={0}
        mb={8}
        bg="gray.100"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <HStack spacing={4} justify="center">
          <Button
            variant="ghost"
            px={4}
            py={3}
            borderRadius="md"
            fontWeight="medium"
            color={activeTab === 'dashboard' ? 'purple.500' : 'gray.700'}
            bg={activeTab === 'dashboard' ? 'purple.50' : 'transparent'}
            _hover={{ bg: 'white', textDecoration: 'none' }}
            display="flex"
            alignItems="center"
            onClick={() => setActiveTab('dashboard')}
          >
            <Icon as={FaHome} mr={2} />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            px={4}
            py={3}
            borderRadius="md"
            fontWeight="medium"
            color={activeTab === 'ai-health-insights' ? 'purple.500' : 'gray.700'}
            bg={activeTab === 'ai-health-insights' ? 'purple.50' : 'transparent'}
            _hover={{ bg: 'white', textDecoration: 'none' }}
            display="flex"
            alignItems="center"
            onClick={() => setActiveTab('ai-health-insights')}
          >
            <Icon as={FaBrain} mr={2} />
            AI Health Insights
          </Button>
          <Button
            variant="ghost"
            px={4}
            py={3}
            borderRadius="md"
            fontWeight="medium"
            color={activeTab === 'nft-education' ? 'purple.500' : 'gray.700'}
            bg={activeTab === 'nft-education' ? 'purple.50' : 'transparent'}
            _hover={{ bg: 'white', textDecoration: 'none' }}
            display="flex"
            alignItems="center"
            onClick={() => setActiveTab('nft-education')}
          >
            <Icon as={FaGraduationCap} mr={2} />
            NFT Education
          </Button>
          <Button
            variant="ghost"
            px={4}
            py={3}
            borderRadius="md"
            fontWeight="medium"
            color={activeTab === 'research-marketplace' ? 'purple.500' : 'gray.700'}
            bg={activeTab === 'research-marketplace' ? 'purple.50' : 'transparent'}
            _hover={{ bg: 'white', textDecoration: 'none' }}
            display="flex"
            alignItems="center"
            onClick={() => setActiveTab('research-marketplace')}
          >
            <Icon as={FaFlask} mr={2} />
            Research Marketplace
          </Button>
        </HStack>
      </Box>

      {/* Main content based on tab */}
      {activeTab === 'dashboard' && (
      <>
      {/* Cycle data cards */}
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} mb={8}>
        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="100%"
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
          >
            <CardHeader bgGradient={cardGradient} borderTopRadius="lg">
              <Heading size="md" color="white">Cycle Overview</Heading>
            </CardHeader>
            <CardBody>
              <Stat>
                <StatLabel>Current Cycle Day</StatLabel>
                <StatNumber>Day {cycleData[0].day}</StatNumber>
                <StatHelpText>Started {cycleData[0].date}</StatHelpText>
              </Stat>
              <Progress 
                value={cycleData[0].day * 3.5} 
                size="sm" 
                colorScheme="purple" 
                borderRadius="full"
                mt={2}
                mb={3}
              />
              <Button sx={animatedGradientStyle} size="sm" width="full">
                Log Today
              </Button>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="100%"
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
          >
            <CardHeader bgGradient={cardGradient} borderTopRadius="lg">
              <Heading size="md" color="white">Mood Tracker</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                {cycleData.map((day, index) => (
                  <HStack key={index} w="100%" justifyContent="space-between">
                    <Text fontWeight="semibold">Day {day.day}:</Text>
                    <Badge colorScheme={
                      day.mood === 'Great' ? 'green' : 
                      day.mood === 'Good' ? 'blue' : 
                      day.mood === 'Fair' ? 'yellow' : 'red'
                    }>
                      {day.mood}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
            <CardFooter pt={0}>
              <Text fontSize="sm" color="gray.500">
                Your mood data is securely encrypted
              </Text>
            </CardFooter>
          </Card>
        </GridItem>

        <GridItem colSpan={1}>
          <Card 
            borderRadius="lg" 
            boxShadow="md" 
            height="100%"
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
          >
            <CardHeader bgGradient={cardGradient} borderTopRadius="lg">
              <Heading size="md" color="white">Symptoms</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                {cycleData.map((day, index) => (
                  <HStack key={index} w="100%" justifyContent="space-between" flexWrap="wrap">
                    <Text fontWeight="semibold">Day {day.day}:</Text>
                    <HStack>
                      {day.symptoms.length > 0 ? 
                        day.symptoms.map((symptom, i) => (
                          <Tag key={i} size="sm" colorScheme="pink" borderRadius="full">
                            {symptom}
                          </Tag>
                        )) : 
                        <Tag size="sm" colorScheme="green" borderRadius="full">None</Tag>
                      }
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Advanced Stellar Features (now after the cycle data cards) */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={10}>
        {advancedFeatures.map((feature, index) => (
          <Card 
            key={index} 
            borderRadius="lg" 
            boxShadow="md" 
            height="100%" 
            _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
          >
            <CardHeader>
              <HStack>
                <Box
                  bg="#8A2BE220"
                  p={2}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xl"
                >
                  {feature.emoji}
                </Box>
                <Heading size="md">{feature.title}</Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Text mb={4}>{feature.description}</Text>
              <Button 
                size="sm" 
                onClick={() => openFeatureModal(feature)}
                sx={animatedGradientStyle}
              >
                Explore
              </Button>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
      
      <Box mb={10}>
        <Heading as="h2" size="lg" mb={4} bgGradient={cardGradient} bgClip="text">
          Secured by Stellar Blockchain
        </Heading>
        <Text mb={6}>
          CycleBuddy leverages the power of Stellar blockchain technology to provide enhanced security and privacy for your health data.
        </Text>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          {blockchainFeatures.map((feature, index) => (
            <Card 
              key={index} 
              borderRadius="lg" 
              boxShadow="md" 
              height="100%"
              _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
            >
              <CardHeader>
                <HStack>
                  <Box
                    bg="#D53F8C20"
                    p={2}
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xl"
                  >
                    {feature.emoji}
                  </Box>
                  <Heading size="md">{feature.title}</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <Text>{feature.description}</Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      <Heading as="h2" size="lg" mb={4} bgGradient={cardGradient} bgClip="text">
        Resources & Information
      </Heading>
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6}>
        {infoCards.map((card, index) => (
          <GridItem key={index}>
            <Card 
              borderRadius="lg" 
              boxShadow="md" 
              height="100%"
              _hover={{ transform: 'translateY(-5px)', transition: 'transform 0.3s' }}
            >
              <CardHeader>
                <HStack>
                  <Box
                    bg="#8A2BE220"
                    p={2}
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xl"
                  >
                    {card.emoji}
                  </Box>
                  <Heading size="md">{card.title}</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <Text>{card.content}</Text>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>

      <Box mt={16} p={6} borderRadius="lg" bg="gray.50" boxShadow="sm">
        <Heading as="h3" size="md" mb={4} textAlign="center">
          Your Data Security
        </Heading>
        <Divider mb={4} />
        <List spacing={3}>
          <ListItem>
            ✓ Secured with Stellar blockchain technology and passkey authentication
          </ListItem>
          <ListItem>
            ✓ Your health data is encrypted and stored securely
          </ListItem>
          <ListItem>
            ✓ Only you have access to your personal information
          </ListItem>
        </List>
      </Box>
      
      {/* Feature Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          {renderModalContent()}
        </ModalContent>
      </Modal>

      {/* Breakthrough Features Section */}
      <Box mb={8}>
        <Heading size="lg" mb={4}>Breakthrough Features</Heading>
        <Text mb={6}>
          Explore our innovative features that leverage the full power of Web3 and the Stellar blockchain to transform menstrual health tracking.
        </Text>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {breakthroughFeatures.map((feature, index) => (
            <Card 
              key={index} 
              boxShadow="md" 
              borderRadius="xl" 
              overflow="hidden"
              height="100%"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-5px)' }}
            >
              <Box bg={`${feature.color}.500`} py={2} px={4}>
                <Text color="white" fontSize="4xl" textAlign="center">{feature.emoji}</Text>
              </Box>
              <CardBody>
                <Heading size="md" mb={2}>{feature.title}</Heading>
                <Text mb={4}>{feature.description}</Text>
              </CardBody>
              <CardFooter pt={0}>
                <Button 
                  colorScheme={feature.color}
                  width="100%"
                  onClick={() => setActiveTab(feature.tabValue)}
                >
                  Explore Feature
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </Box>
      </>
      )}

      {/* AI Health Insights Tab */}
      {activeTab === 'ai-health-insights' && (
        <Box>
          <Box mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="xl">AI-Powered Health Insights</Heading>
              <HStack spacing={4}>
                <Box width="250px">
                  <Select
                    placeholder="Select AI model"
                  >
                    <option>Cycle Pattern Analyzer (v1.2)</option>
                    <option>Symptom Correlation Engine (v2.0)</option>
                  </Select>
                </Box>
                <Button
                  colorScheme="purple"
                  leftIcon={<FaBrain />}
                >
                  Generate Insights
                </Button>
              </HStack>
            </Flex>
            
            <Text color="gray.600" mb={6}>
              Leverage machine learning algorithms running on Stellar Turrets to analyze your encrypted health data and identify patterns that might indicate health issues, all while ensuring your data remains private.
            </Text>
            
            <HStack mb={6}>
              <Tag colorScheme="green" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaLock} mr={2} />
                Privacy Preserving
              </Tag>
              <Tag colorScheme="blue" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaBrain} mr={2} />
                Federated Learning
              </Tag>
              <Tag colorScheme="purple" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaCheckCircle} mr={2} />
                Secure Computation
              </Tag>
            </HStack>
          </Box>

          {/* Example insights based on screenshot */}
          <Grid templateColumns="repeat(3, 1fr)" gap={6}>
            <Card borderRadius="md" overflow="hidden">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Cycle Regularity Improving</Heading>
                  <Badge colorScheme="blue">INFORMATIONAL</Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Text>Your cycle has shown improved regularity over the past 3 months.</Text>
              </CardBody>
              <Divider />
              <CardFooter>
                <Flex width="100%" justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaInfoCircle} color="blue.500" />
                    <Text fontSize="sm">Confidence: 85%</Text>
                  </HStack>
                  <Badge colorScheme="gray">UNVERIFIED</Badge>
                </Flex>
              </CardFooter>
            </Card>
            
            <Card borderRadius="md" overflow="hidden">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Potential Symptom Pattern</Heading>
                  <Badge colorScheme="yellow">ADVISORY</Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Text>We've detected a pattern between certain foods and increased cramps.</Text>
              </CardBody>
              <Divider />
              <CardFooter>
                <Flex width="100%" justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaExclamationTriangle} color="yellow.500" />
                    <Text fontSize="sm">Confidence: 70%</Text>
                  </HStack>
                  <Badge colorScheme="gray">UNVERIFIED</Badge>
                </Flex>
              </CardFooter>
            </Card>
            
            <Card borderRadius="md" overflow="hidden">
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Unusual Cycle Length</Heading>
                  <Badge colorScheme="red">ALERT</Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Text>Your last cycle was significantly longer than your average. This could be due to stress, diet changes, or other factors.</Text>
              </CardBody>
              <Divider />
              <CardFooter>
                <Flex width="100%" justify="space-between" align="center">
                  <HStack>
                    <Icon as={FaBell} color="red.500" />
                    <Text fontSize="sm">Confidence: 90%</Text>
                  </HStack>
                  <Badge colorScheme="green">VERIFIED</Badge>
                </Flex>
              </CardFooter>
            </Card>
          </Grid>
        </Box>
      )}

      {/* NFT Education Tab */}
      {activeTab === 'nft-education' && (
        <Box>
          <Box mb={8}>
            <Heading size="xl" mb={4}>NFT-Based Educational Achievement</Heading>
            <Text color="gray.600" mb={6}>
              Complete educational modules on menstrual and reproductive health to earn unique Stellar-based NFTs. 
              These NFTs serve as proof of your health knowledge and can unlock benefits from partner organizations.
            </Text>
            
            <HStack mb={6}>
              <Tag colorScheme="green" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaGraduationCap} mr={2} />
                Learn-to-Earn
              </Tag>
              <Tag colorScheme="blue" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaCertificate} mr={2} />
                Verifiable Knowledge
              </Tag>
              <Tag colorScheme="purple" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaMedal} mr={2} />
                Partner Benefits
              </Tag>
            </HStack>
          </Box>

          <Tabs variant="soft-rounded" colorScheme="purple" mb={8}>
            <TabList>
              <Tab>Available Modules</Tab>
              <Tab>My Progress</Tab>
              <Tab>My NFT Collection</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
                  <Card height="100%" shadow="md" borderRadius="lg">
                    <CardHeader pb={2}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Understanding Your Cycle Basics</Heading>
                        <Badge colorScheme="green">LEVEL 1</Badge>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text noOfLines={3} mb={4}>
                        Learn the fundamentals of menstrual health and cycle tracking.
                      </Text>
                      <HStack mb={2} flexWrap="wrap">
                        <Tag size="sm">Cycle Phases</Tag>
                        <Tag size="sm">Tracking Basics</Tag>
                        <Tag size="sm">Period Symptoms</Tag>
                      </HStack>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                      <Button colorScheme="green" leftIcon={<FaCheck />}>
                        Completed
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card height="100%" shadow="md" borderRadius="lg">
                    <CardHeader pb={2}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Nutrition and Your Cycle</Heading>
                        <Badge colorScheme="blue">LEVEL 2</Badge>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text noOfLines={3} mb={4}>
                        Explore how nutrition impacts your menstrual health and overall wellbeing.
                      </Text>
                      <HStack mb={2} flexWrap="wrap">
                        <Tag size="sm">Nutrition</Tag>
                        <Tag size="sm">Hormonal Balance</Tag>
                        <Tag size="sm">Diet Tips</Tag>
                      </HStack>
                      <Box mt={3}>
                        <Text fontSize="sm" mb={1}>Your Progress</Text>
                        <Progress value={60} colorScheme="purple" hasStripe size="sm" />
                      </Box>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                      <Button colorScheme="blue" leftIcon={<FaGraduationCap />}>
                        Continue
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card height="100%" shadow="md" borderRadius="lg">
                    <CardHeader pb={2}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Advanced Hormonal Health</Heading>
                        <Badge colorScheme="purple">LEVEL 3</Badge>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Text noOfLines={3} mb={4}>
                        Dive deep into hormonal influences on your cycle and overall health.
                      </Text>
                      <HStack mb={2} flexWrap="wrap">
                        <Tag size="sm">Hormones</Tag>
                        <Tag size="sm">Endocrine System</Tag>
                        <Tag size="sm">Hormonal Disorders</Tag>
                      </HStack>
                    </CardBody>
                    <Divider />
                    <CardFooter>
                      <Button colorScheme="purple" leftIcon={<FaGraduationCap />}>
                        Start Module
                      </Button>
                    </CardFooter>
                  </Card>
                </Grid>
              </TabPanel>
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Card>
                    <CardBody>
                      <Grid templateColumns="1fr 2fr 1fr" gap={6} alignItems="center">
                        <Flex direction="column">
                          <Heading size="md">Nutrition and Your Cycle</Heading>
                          <Badge colorScheme="blue" width="fit-content" mt={1}>Level 2</Badge>
                          <Text fontSize="sm" mt={2}>Started: 2023-08-15</Text>
                        </Flex>
                        <Box>
                          <Text mb={1}>Progress: 60%</Text>
                          <Progress value={60} colorScheme="purple" hasStripe size="md" />
                          <Text fontSize="sm" mt={2}>
                            Status: <Badge colorScheme="blue">InProgress</Badge>
                          </Text>
                        </Box>
                        <Flex justify="flex-end">
                          <Button colorScheme="blue">Continue</Button>
                        </Flex>
                      </Grid>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              <TabPanel px={0}>
                <Box textAlign="center" p={8}>
                  <Icon as={FaCertificate} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No NFTs Earned Yet</Heading>
                  <Text>Complete educational modules to earn NFT credentials.</Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}

      {/* Research Marketplace Tab */}
      {activeTab === 'research-marketplace' && (
        <Box>
          <Box mb={8}>
            <Heading size="xl" mb={4}>Decentralized Research Marketplace</Heading>
            <Text color="gray.600" mb={6}>
              Contribute anonymous health data to research initiatives of your choosing and receive fair 
              compensation through smart contracts. Your privacy is maintained while supporting valuable health research.
            </Text>
            
            <HStack mb={6}>
              <Tag colorScheme="green" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaShieldAlt} mr={2} />
                Privacy Preserving
              </Tag>
              <Tag colorScheme="blue" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaMoneyBillWave} mr={2} />
                Fair Compensation
              </Tag>
              <Tag colorScheme="purple" size="md" py={2} px={4} borderRadius="full">
                <Icon as={FaFlask} mr={2} />
                Support Research
              </Tag>
            </HStack>
          </Box>

          <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={8}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Reputation Score</StatLabel>
                  <StatNumber>72</StatNumber>
                  <StatHelpText>
                    ▲ Above average
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Contributions</StatLabel>
                  <StatNumber>3</StatNumber>
                  <StatHelpText>
                    Last contributed: 2025-05-10
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Earned</StatLabel>
                  <StatNumber>5.0000000 XLM</StatNumber>
                  <StatHelpText>
                    ▲ Through data contributions
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Preferred Categories</StatLabel>
                  <HStack mt={2} spacing={1} flexWrap="wrap">
                    <Tag size="sm" colorScheme="blue" m={1}>symptoms</Tag>
                    <Tag size="sm" colorScheme="blue" m={1}>cycle_length</Tag>
                    <Tag size="sm" colorScheme="blue" m={1}>diet</Tag>
                  </HStack>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          <Tabs variant="soft-rounded" colorScheme="purple" mb={8}>
            <TabList>
              <Tab>Available Research Projects</Tab>
              <Tab>My Contributions</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                {/* Active research project example based on screenshot */}
                <Box>
                  <Card borderWidth="1px" borderRadius="lg" overflow="hidden" mb={4}>
                    <CardBody>
                      <Box>
                        <Flex align="center" mb={2}>
                          <Heading size="md" mr={2}>Cycle Pattern Analysis Study</Heading>
                          <Badge colorScheme="green" mr={2}>ACTIVE</Badge>
                          <Badge colorScheme="green">ETHICALLY APPROVED</Badge>
                        </Flex>
                        
                        <Text mb={4}>Research on identifying patterns in menstrual cycles that could indicate underlying health conditions.</Text>
                        
                        <HStack mb={3}>
                          <Icon as={FaUniversity} color="purple.500" />
                          <Text fontWeight="bold">Women's Health Research Institute</Text>
                        </HStack>
                        
                        <Text fontSize="sm" mb={2}>Accepting data in these categories:</Text>
                        <HStack mb={4} flexWrap="wrap">
                          <Tag colorScheme="blue" size="sm" m={1}>cycle_length</Tag>
                          <Tag colorScheme="blue" size="sm" m={1}>symptoms</Tag>
                          <Tag colorScheme="blue" size="sm" m={1}>flow_intensity</Tag>
                        </HStack>
                        
                        <Box p={4} bg="gray.50" borderRadius="md" mb={4}>
                          <HStack mb={3} justifyContent="space-between">
                            <Box>
                              <Text fontSize="sm" color="gray.500">Payment per Contribution</Text>
                              <Text fontWeight="bold">5.0000000 XLM</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color="gray.500">Min. Reputation Required</Text>
                              <Text fontWeight="bold">40</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color="gray.500">Contributions</Text>
                              <Text fontWeight="bold">20</Text>
                            </Box>
                          </HStack>
                          
                          <Box>
                            <Flex justify="space-between" align="center" mb={1}>
                              <Text fontSize="xs">Remaining Budget</Text>
                              <Text fontSize="sm">900.0000000 / 1000.0000000 XLM</Text>
                            </Flex>
                            <Progress 
                              value={90} 
                              colorScheme="green" 
                              height="8px"
                              borderRadius="full"
                            />
                          </Box>
                        </Box>
                        
                        <Flex justifyContent="space-between" alignItems="center">
                          <Flex align="center">
                            <Icon as={FaClock} color="orange.500" mr={2} />
                            <Text>Expires On: 2025-09-12</Text>
                          </Flex>
                          
                          <Button 
                            colorScheme="purple" 
                            leftIcon={<FaChartLine />}
                          >
                            Contribute Data
                          </Button>
                        </Flex>
                      </Box>
                    </CardBody>
                  </Card>
                </Box>
              </TabPanel>
              <TabPanel>
                <Box textAlign="center" p={8}>
                  <Icon as={FaChartLine} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No Contributions Yet</Heading>
                  <Text>Contribute to research projects to see your contributions here.</Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}

      {/* Feature Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          {renderModalContent()}
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default DashboardPage; 