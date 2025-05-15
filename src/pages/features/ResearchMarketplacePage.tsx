import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Divider,
  VStack,
  HStack,
  Tag,
  Flex,
  Icon,
  Spinner,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { 
  FaShieldAlt, 
  FaMoneyBillWave, 
  FaFlask, 
  FaChartLine, 
  FaUniversity, 
  FaCheck, 
  FaClock,
  FaUserShield,
  FaHospital,
  FaExclamationTriangle,
  FaTrophy,
  FaInfoCircle,
} from 'react-icons/fa';
import { stellarContractService } from '../../services/stellar/contractService';
import MainLayout from '../../components/layout/MainLayout';

export default function ResearchMarketplacePage() {
  const [activeProjects, setActiveProjects] = useState([]);
  const [userContributions, setUserContributions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    // Load data on component mount
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get active research projects
      const projects = await stellarContractService.getActiveResearchProjects();
      setActiveProjects(projects);

      // Get user's contributions
      const contributions = await stellarContractService.getUserResearchContributions();
      setUserContributions(contributions);

      // Get user profile
      const profile = await stellarContractService.getUserResearchProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load research marketplace data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContributeData = (project) => {
    setSelectedProject(project);
    setSelectedCategories([]);
    onOpen();
  };

  const handleSubmitContribution = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: 'Please select at least one data category',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setContributing(true);
    try {
      // Generate a mock data hash (in real app, this would be hash of actual data)
      const dataHash = `hash_${Date.now()}`;
      
      // Call service to contribute data
      const result = await stellarContractService.contributeResearchData(
        selectedProject.id,
        dataHash,
        selectedCategories
      );
      
      if (result) {
        toast({
          title: 'Contribution Successful',
          description: `You've contributed to ${selectedProject.name}. Payment will be processed shortly.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose();
        await loadData();
      }
    } catch (error) {
      console.error('Error contributing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your contribution',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setContributing(false);
    }
  };

  const handleClaimPayment = async (contributionId) => {
    try {
      const result = await stellarContractService.claimResearchPayment(contributionId);
      if (result) {
        toast({
          title: 'Payment Claimed',
          description: 'Your payment has been processed and added to your wallet',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error claiming payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'green';
      case 'Paused': return 'yellow';
      case 'Completed': return 'blue';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Format XLM amounts with proper decimal places
  const formatXLM = (amount) => {
    return (amount / 10000000).toFixed(7);
  };

  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading size="xl" mb={4}>Decentralized Research Marketplace</Heading>
          <Text color="gray.600" mb={6}>
            Contribute anonymous health data to research initiatives of your choosing and receive fair 
            compensation through smart contracts. Your privacy is maintained while supporting valuable health research.
          </Text>
          
          <HStack mb={6}>
            <Tag colorScheme="green" size="md">
              <Icon as={FaUserShield} mr={2} />
              Privacy Preserving
            </Tag>
            <Tag colorScheme="blue" size="md">
              <Icon as={FaMoneyBillWave} mr={2} />
              Fair Compensation
            </Tag>
            <Tag colorScheme="purple" size="md">
              <Icon as={FaFlask} mr={2} />
              Support Research
            </Tag>
          </HStack>
        </Box>

        {userProfile && (
          <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={8}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Reputation Score</StatLabel>
                  <StatNumber>{userProfile.reputation_score}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {userProfile.reputation_score > 50 ? 'Above average' : 'Building reputation'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Contributions</StatLabel>
                  <StatNumber>{userProfile.total_contributions}</StatNumber>
                  <StatHelpText>
                    {userProfile.last_contribution > 0 
                      ? `Last contributed: ${new Date(userProfile.last_contribution).toLocaleDateString()}`
                      : 'No contributions yet'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Earned</StatLabel>
                  <StatNumber>{formatXLM(userProfile.total_earned)} XLM</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Through data contributions
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Preferred Categories</StatLabel>
                  <HStack mt={2} spacing={1} flexWrap="wrap">
                    {userProfile.top_categories && userProfile.top_categories.map((cat, idx) => (
                      <Tag key={idx} size="sm" colorScheme="blue" m={1}>
                        {cat}
                      </Tag>
                    ))}
                    {(!userProfile.top_categories || userProfile.top_categories.length === 0) && (
                      <Text fontSize="sm" color="gray.500">No data yet</Text>
                    )}
                  </HStack>
                </Stat>
              </CardBody>
            </Card>
          </Grid>
        )}

        <Tabs isFitted variant="enclosed" colorScheme="purple" mb={8}>
          <TabList>
            <Tab>Available Research Projects</Tab>
            <Tab>My Contributions</Tab>
          </TabList>

          <TabPanels>
            {/* Available Projects Tab */}
            <TabPanel>
              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" thickness="4px" color="purple.500" />
                </Flex>
              ) : activeProjects.length === 0 ? (
                <Box textAlign="center" p={8}>
                  <Icon as={FaFlask} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No Active Research Projects</Heading>
                  <Text>Check back soon for new research opportunities.</Text>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {activeProjects.map((project) => (
                    <Card key={project.id} borderWidth="1px" borderRadius="lg" overflow="hidden">
                      <CardBody>
                        <Grid templateColumns={{ base: "1fr", md: "3fr 1fr" }} gap={6}>
                          <Box>
                            <Flex align="center" mb={2}>
                              <Heading size="md" mr={2}>{project.name}</Heading>
                              <Badge colorScheme={getProjectStatusColor(project.status)}>
                                {project.status}
                              </Badge>
                              {project.ethically_approved && (
                                <Badge colorScheme="green" ml={2}>Ethically Approved</Badge>
                              )}
                            </Flex>
                            
                            <Text mb={4}>{project.description}</Text>
                            
                            <HStack mb={3}>
                              <Icon as={FaUniversity} color="purple.500" />
                              <Text fontWeight="bold">{project.institution}</Text>
                            </HStack>
                            
                            <Text fontSize="sm" mb={2}>Accepting data in these categories:</Text>
                            <HStack mb={4} flexWrap="wrap">
                              {project.data_categories.map((category, idx) => (
                                <Tag key={idx} colorScheme="blue" size="sm" m={1}>
                                  {category}
                                </Tag>
                              ))}
                            </HStack>
                            
                            <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={3}>
                              <Box>
                                <Text fontSize="sm" color="gray.500">Payment per Contribution</Text>
                                <Text fontWeight="bold">{formatXLM(project.payment_per_contribution)} XLM</Text>
                              </Box>
                              <Box>
                                <Text fontSize="sm" color="gray.500">Min. Reputation Required</Text>
                                <Text fontWeight="bold">{project.min_reputation}</Text>
                              </Box>
                              <Box>
                                <Text fontSize="sm" color="gray.500">Contributions</Text>
                                <Text fontWeight="bold">{project.contribution_count}</Text>
                              </Box>
                            </Grid>
                            
                            <Flex justify="space-between" align="center">
                              <Box width="70%">
                                <Text fontSize="xs" mb={1}>Remaining Budget</Text>
                                <Progress 
                                  value={(project.remaining_budget / project.total_budget) * 100} 
                                  colorScheme="green" 
                                  height="8px"
                                />
                              </Box>
                              <Text fontSize="sm">
                                {formatXLM(project.remaining_budget)} / {formatXLM(project.total_budget)} XLM
                              </Text>
                            </Flex>
                          </Box>
                          
                          <Flex direction="column" justify="space-between">
                            <Box>
                              {project.expires_at && (
                                <VStack align="start">
                                  <Text fontSize="sm" color="gray.500">Expires On</Text>
                                  <HStack>
                                    <Icon as={FaClock} color="orange.500" />
                                    <Text>{new Date(project.expires_at).toLocaleDateString()}</Text>
                                  </HStack>
                                </VStack>
                              )}
                            </Box>
                            
                            <VStack spacing={2} align="stretch" mt={4}>
                              <Button 
                                colorScheme="purple" 
                                onClick={() => handleContributeData(project)}
                                isDisabled={userProfile && userProfile.reputation_score < project.min_reputation}
                                leftIcon={<FaChartLine />}
                              >
                                Contribute Data
                              </Button>
                              
                              {userProfile && userProfile.reputation_score < project.min_reputation && (
                                <Text fontSize="xs" color="red.500" textAlign="center">
                                  You need a reputation of {project.min_reputation} to contribute
                                </Text>
                              )}
                            </VStack>
                          </Flex>
                        </Grid>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* My Contributions Tab */}
            <TabPanel>
              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" thickness="4px" color="purple.500" />
                </Flex>
              ) : userContributions.length === 0 ? (
                <Box textAlign="center" p={8}>
                  <Icon as={FaChartLine} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No Contributions Yet</Heading>
                  <Text>Contribute to research projects to see your contributions here.</Text>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {userContributions.map((contribution) => {
                    const project = activeProjects.find(p => p.id === contribution.project_id) || {};
                    return (
                      <Card key={contribution.id}>
                        <CardBody>
                          <Grid templateColumns={{ base: "1fr", md: "3fr 1fr" }} gap={6}>
                            <Box>
                              <Heading size="md" mb={2}>
                                {project.name || 'Unknown Project'}
                              </Heading>
                              
                              <Flex mb={3}>
                                <Text fontSize="sm" color="gray.500" mr={4}>
                                  Contribution Date: {new Date(contribution.created_at).toLocaleDateString()}
                                </Text>
                                <Badge colorScheme={contribution.approved ? "green" : "yellow"}>
                                  {contribution.approved ? "Approved" : "Pending Approval"}
                                </Badge>
                              </Flex>
                              
                              <Text fontSize="sm" mb={2}>Contributed Data Categories:</Text>
                              <HStack mb={4} flexWrap="wrap">
                                {contribution.categories.map((category, idx) => (
                                  <Tag key={idx} size="sm" m={1}>
                                    {category}
                                  </Tag>
                                ))}
                              </HStack>
                              
                              <Flex mb={2}>
                                <Box mr={8}>
                                  <Text fontSize="sm" color="gray.500">Data Quality Score</Text>
                                  <Text fontWeight="bold">{contribution.quality_score}/100</Text>
                                </Box>
                                <Box>
                                  <Text fontSize="sm" color="gray.500">Payment Amount</Text>
                                  <Text fontWeight="bold">{formatXLM(contribution.payment_amount)} XLM</Text>
                                </Box>
                              </Flex>
                            </Box>
                            
                            <Flex direction="column" justify="center" align="center">
                              {contribution.approved && !contribution.payment_claimed && (
                                <VStack spacing={2}>
                                  <Button 
                                    colorScheme="green" 
                                    onClick={() => handleClaimPayment(contribution.id)}
                                    leftIcon={<FaMoneyBillWave />}
                                    width="100%"
                                  >
                                    Claim Payment
                                  </Button>
                                  <Text fontSize="xs" color="green.600">
                                    {formatXLM(contribution.payment_amount)} XLM available
                                  </Text>
                                </VStack>
                              )}
                              
                              {contribution.approved && contribution.payment_claimed && (
                                <VStack spacing={1}>
                                  <Badge colorScheme="green" p={2} borderRadius="md">
                                    <Flex align="center">
                                      <Icon as={FaCheck} mr={2} />
                                      Payment Claimed
                                    </Flex>
                                  </Badge>
                                  <Text fontSize="xs" color="gray.500">
                                    Transaction: {contribution.payment_tx_id ? 
                                      contribution.payment_tx_id.substring(0, 8) + '...' :
                                      'Processing'}
                                  </Text>
                                </VStack>
                              )}
                              
                              {!contribution.approved && (
                                <VStack spacing={1}>
                                  <Badge colorScheme="yellow" p={2} borderRadius="md">
                                    <Flex align="center">
                                      <Icon as={FaClock} mr={2} />
                                      Pending Approval
                                    </Flex>
                                  </Badge>
                                  <Text fontSize="xs" color="gray.500">
                                    Check back soon
                                  </Text>
                                </VStack>
                              )}
                            </Flex>
                          </Grid>
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Contribute Data Modal */}
        {selectedProject && (
          <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Contribute Data to {selectedProject.name}</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text mb={4}>
                  You're about to contribute anonymized health data to this research project. 
                  Select the categories of data you wish to contribute.
                </Text>
                
                <Box mb={4} p={3} bg="blue.50" borderRadius="md">
                  <Flex align="center" mb={2}>
                    <Icon as={FaInfoCircle} color="blue.500" mr={2} />
                    <Text fontWeight="bold">Privacy Protection</Text>
                  </Flex>
                  <Text fontSize="sm">
                    Your data will be anonymized and encrypted before submission. No personally identifiable 
                    information is shared with researchers.
                  </Text>
                </Box>
                
                <FormControl mb={4}>
                  <FormLabel fontWeight="bold">Select Data Categories</FormLabel>
                  <CheckboxGroup 
                    colorScheme="purple" 
                    onChange={setSelectedCategories}
                    value={selectedCategories}
                  >
                    <VStack align="start" spacing={2}>
                      {selectedProject.data_categories.map((category, idx) => (
                        <Checkbox key={idx} value={category}>
                          {category}
                        </Checkbox>
                      ))}
                    </VStack>
                  </CheckboxGroup>
                </FormControl>
                
                <Divider my={4} />
                
                <Grid templateColumns="1fr 1fr" gap={4} mb={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Payment per Contribution</Text>
                    <Text fontWeight="bold">{formatXLM(selectedProject.payment_per_contribution)} XLM</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Estimated Quality Score</Text>
                    <Text fontWeight="bold">{userProfile ? userProfile.reputation_score : 50}/100</Text>
                  </Box>
                </Grid>
                
                <Box bg="yellow.50" p={3} borderRadius="md">
                  <Flex align="center">
                    <Icon as={FaExclamationTriangle} color="yellow.500" mr={2} />
                    <Text fontSize="sm">
                      By proceeding, you authorize the system to anonymize and submit your selected 
                      health data categories to this research project.
                    </Text>
                  </Flex>
                </Box>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="purple" 
                  onClick={handleSubmitContribution}
                  isLoading={contributing}
                  loadingText="Processing"
                  isDisabled={selectedCategories.length === 0}
                >
                  Contribute Data
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </Container>
    </MainLayout>
  );
} 