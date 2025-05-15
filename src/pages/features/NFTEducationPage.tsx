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
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Link,
  SimpleGrid,
  Stack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FaGraduationCap, FaTrophy, FaCertificate, FaMedal, FaCheck, FaLock, FaExternalLinkAlt } from 'react-icons/fa';
import { stellarContractService } from '../../services/stellar/contractService';
import MainLayout from '../../components/layout/MainLayout';

// Mock NFT images for demo
const nftImageUrls = [
  'https://via.placeholder.com/300/8A2BE2/FFFFFF?text=Basic+Cycle+Knowledge',
  'https://via.placeholder.com/300/D53F8C/FFFFFF?text=Nutrition+Fundamentals',
  'https://via.placeholder.com/300/38B2AC/FFFFFF?text=Hormonal+Health',
  'https://via.placeholder.com/300/4299E1/FFFFFF?text=Advanced+Cycle+Tracking',
  'https://via.placeholder.com/300/ECC94B/FFFFFF?text=Reproductive+Health',
];

export default function NFTEducationPage() {
  const [modules, setModules] = useState([]);
  const [userModules, setUserModules] = useState([]);
  const [userNFTs, setUserNFTs] = useState([]);
  const [partnerBenefits, setPartnerBenefits] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleAction, setModuleAction] = useState('');
  const toast = useToast();

  useEffect(() => {
    // Load data on component mount
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get educational modules
      const eduModules = await stellarContractService.getEducationalModules();
      setModules(eduModules);

      // Get user's enrolled/completed modules
      const userProgress = await stellarContractService.getUserModuleProgress();
      setUserModules(userProgress);

      // Get user's NFTs
      const nfts = await stellarContractService.getUserNFTs();
      setUserNFTs(nfts);

      // Get partner benefits
      const benefits = await stellarContractService.getPartnerBenefits();
      setPartnerBenefits(benefits);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load educational data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartModule = async (moduleId) => {
    try {
      const result = await stellarContractService.startEducationalModule(moduleId);
      if (result) {
        toast({
          title: 'Success',
          description: 'Module started successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error starting module:', error);
      toast({
        title: 'Error',
        description: 'Failed to start module',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCompleteModule = async (moduleId) => {
    try {
      const result = await stellarContractService.completeEducationalModule(moduleId);
      if (result) {
        toast({
          title: 'Congratulations!',
          description: 'Module completed successfully. You earned an NFT!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error completing module:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete module',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateProgress = async (moduleId, progress) => {
    try {
      // In a real app, this would use actual quiz scores or time spent
      const result = await stellarContractService.updateModuleProgress(
        moduleId,
        progress // Simulated progress percentage
      );
      
      if (result) {
        toast({
          title: 'Progress Saved',
          description: 'Your module progress has been updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openModuleDetail = (module, action) => {
    setSelectedModule(module);
    setModuleAction(action);
    onOpen();
  };

  const renderModuleActionButton = (module) => {
    const userModule = userModules.find(um => um.module_id === module.id);
    
    if (!userModule) {
      return (
        <Button 
          colorScheme="purple" 
          onClick={() => handleStartModule(module.id)}
          leftIcon={<FaGraduationCap />}
        >
          Start Module
        </Button>
      );
    }
    
    if (userModule.status === 'Completed') {
      return (
        <Button 
          colorScheme="green" 
          isDisabled
          leftIcon={<FaCheck />}
        >
          Completed
        </Button>
      );
    }
    
    if (userModule.status === 'InProgress') {
      return (
        <HStack spacing={2}>
          <Button 
            colorScheme="blue" 
            onClick={() => openModuleDetail(module, 'continue')}
            leftIcon={<FaGraduationCap />}
          >
            Continue
          </Button>
          {userModule.progress >= 100 && (
            <Button 
              colorScheme="green" 
              onClick={() => handleCompleteModule(module.id)}
              leftIcon={<FaTrophy />}
            >
              Complete
            </Button>
          )}
        </HStack>
      );
    }
    
    return null;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 1: return 'green';
      case 2: return 'blue';
      case 3: return 'purple';
      case 4: return 'orange';
      case 5: return 'red';
      default: return 'gray';
    }
  };

  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading size="xl" mb={4}>NFT-Based Educational Achievement</Heading>
          <Text color="gray.600" mb={6}>
            Complete educational modules on menstrual and reproductive health to earn unique Stellar-based NFTs. 
            These NFTs serve as proof of your health knowledge and can unlock benefits from partner organizations.
          </Text>
          
          <HStack mb={6}>
            <Tag colorScheme="green" size="md">
              <Icon as={FaGraduationCap} mr={2} />
              Learn-to-Earn
            </Tag>
            <Tag colorScheme="blue" size="md">
              <Icon as={FaCertificate} mr={2} />
              Verifiable Knowledge
            </Tag>
            <Tag colorScheme="purple" size="md">
              <Icon as={FaMedal} mr={2} />
              Partner Benefits
            </Tag>
          </HStack>
        </Box>

        <Tabs isFitted variant="enclosed" colorScheme="purple" mb={8}>
          <TabList>
            <Tab>Available Modules</Tab>
            <Tab>My Progress</Tab>
            <Tab>My NFT Collection</Tab>
            <Tab>Partner Benefits</Tab>
          </TabList>

          <TabPanels>
            {/* Available Modules Tab */}
            <TabPanel>
              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" thickness="4px" color="purple.500" />
                </Flex>
              ) : modules.length === 0 ? (
                <Box textAlign="center" p={8}>
                  <Icon as={FaGraduationCap} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No Educational Modules Available</Heading>
                  <Text>Check back soon for new modules.</Text>
                </Box>
              ) : (
                <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
                  {modules.map((module) => (
                    <Card key={module.id} height="100%">
                      <CardHeader pb={2}>
                        <Flex justify="space-between" align="center">
                          <Heading size="md">{module.title}</Heading>
                          <Badge colorScheme={getLevelColor(module.level)}>
                            Level {module.level}
                          </Badge>
                        </Flex>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text noOfLines={3} mb={4}>{module.description}</Text>
                        <HStack mb={2}>
                          {module.topics.map((topic, idx) => (
                            <Tag key={idx} size="sm">{topic}</Tag>
                          ))}
                        </HStack>
                        
                        {userModules.find(um => um.module_id === module.id && um.status === 'InProgress') && (
                          <Box mt={3}>
                            <Text fontSize="sm" mb={1}>Your Progress</Text>
                            <Progress value={userModules.find(um => um.module_id === module.id).progress} 
                                    colorScheme="purple" 
                                    hasStripe 
                                    size="sm" />
                          </Box>
                        )}
                      </CardBody>
                      <Divider />
                      <CardFooter>
                        {renderModuleActionButton(module)}
                      </CardFooter>
                    </Card>
                  ))}
                </Grid>
              )}
            </TabPanel>

            {/* My Progress Tab */}
            <TabPanel>
              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" thickness="4px" color="purple.500" />
                </Flex>
              ) : userModules.length === 0 ? (
                <Box textAlign="center" p={8}>
                  <Icon as={FaGraduationCap} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No Modules In Progress</Heading>
                  <Text>Start a module to track your educational progress.</Text>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {userModules.map((userModule) => {
                    const module = modules.find(m => m.id === userModule.module_id) || {};
                    return (
                      <Card key={userModule.module_id}>
                        <CardBody>
                          <Grid templateColumns="1fr 2fr 1fr" gap={6} alignItems="center">
                            <Flex direction="column">
                              <Heading size="md">{module.title || 'Unknown Module'}</Heading>
                              <Badge colorScheme={getLevelColor(module.level)} width="fit-content" mt={1}>
                                Level {module.level || '?'}
                              </Badge>
                              <Text fontSize="sm" mt={2}>Started: {new Date(userModule.started_at).toLocaleDateString()}</Text>
                            </Flex>
                            
                            <Box>
                              <Text mb={1}>Progress: {userModule.progress}%</Text>
                              <Progress value={userModule.progress} 
                                      colorScheme="purple" 
                                      hasStripe 
                                      size="md" />
                                      
                              <Text fontSize="sm" mt={2}>
                                Status: <Badge colorScheme={userModule.status === 'Completed' ? 'green' : 'blue'}>
                                  {userModule.status}
                                </Badge>
                              </Text>
                            </Box>
                            
                            <Flex justify="flex-end">
                              {userModule.status === 'InProgress' && (
                                <VStack>
                                  <Button 
                                    colorScheme="blue" 
                                    onClick={() => openModuleDetail(module, 'continue')}
                                    width="100%"
                                  >
                                    Continue
                                  </Button>
                                  
                                  {userModule.progress >= 100 && (
                                    <Button 
                                      colorScheme="green" 
                                      onClick={() => handleCompleteModule(userModule.module_id)}
                                      width="100%"
                                    >
                                      Complete & Claim NFT
                                    </Button>
                                  )}
                                </VStack>
                              )}
                              
                              {userModule.status === 'Completed' && (
                                <Flex align="center">
                                  <Icon as={FaTrophy} color="green.500" boxSize={6} mr={2} />
                                  <Text color="green.500" fontWeight="bold">Completed</Text>
                                </Flex>
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

            {/* My NFT Collection Tab */}
            <TabPanel>
              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" thickness="4px" color="purple.500" />
                </Flex>
              ) : userNFTs.length === 0 ? (
                <Box textAlign="center" p={8}>
                  <Icon as={FaCertificate} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No NFTs Earned Yet</Heading>
                  <Text>Complete educational modules to earn NFT credentials.</Text>
                </Box>
              ) : (
                <SimpleGrid columns={[1, 2, 3]} spacing={10}>
                  {userNFTs.map((nft, index) => (
                    <Box 
                      key={nft.asset_id} 
                      borderWidth="1px" 
                      borderRadius="lg" 
                      overflow="hidden"
                      boxShadow="md"
                      transition="transform 0.3s"
                      _hover={{ transform: 'scale(1.05)' }}
                    >
                      <Image 
                        src={nftImageUrls[index % nftImageUrls.length]} 
                        alt={nft.name} 
                        width="100%" 
                      />
                      
                      <Box p={5}>
                        <Heading size="md" mb={2}>{nft.name}</Heading>
                        <Text fontSize="sm" mb={3}>{nft.description}</Text>
                        
                        <HStack>
                          <Badge colorScheme={getLevelColor(nft.level)}>Level {nft.level}</Badge>
                          <Badge colorScheme="green">Verified</Badge>
                        </HStack>
                        
                        <Divider my={3} />
                        
                        <Box>
                          <Text fontSize="xs" color="gray.500">Asset ID</Text>
                          <Text fontSize="xs" isTruncated>{nft.asset_id}</Text>
                        </Box>
                        
                        <Button 
                          colorScheme="purple" 
                          variant="outline" 
                          size="sm" 
                          mt={3}
                          rightIcon={<FaExternalLinkAlt />}
                          width="100%"
                        >
                          View on Explorer
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>

            {/* Partner Benefits Tab */}
            <TabPanel>
              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" thickness="4px" color="purple.500" />
                </Flex>
              ) : partnerBenefits.length === 0 ? (
                <Box textAlign="center" p={8}>
                  <Icon as={FaMedal} boxSize={12} color="gray.400" mb={4} />
                  <Heading size="md">No Partner Benefits Available</Heading>
                  <Text>Check back soon for partner benefits.</Text>
                </Box>
              ) : (
                <Accordion allowMultiple>
                  {partnerBenefits.map((benefit) => (
                    <AccordionItem key={benefit.id}>
                      <h2>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <Flex align="center">
                              <Text fontWeight="bold">{benefit.title}</Text>
                              <Badge colorScheme="purple" ml={2}>
                                {benefit.partner_name}
                              </Badge>
                              {benefit.eligible && (
                                <Badge colorScheme="green" ml={2}>Eligible</Badge>
                              )}
                            </Flex>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <Text mb={3}>{benefit.description}</Text>
                        
                        <VStack align="start" spacing={3}>
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">Required NFTs:</Text>
                            <HStack mt={1}>
                              {benefit.required_modules.map((module, idx) => (
                                <Tag key={idx} colorScheme={benefit.eligible ? "green" : "gray"}>
                                  {module.title}
                                  {benefit.eligible && <Icon as={FaCheck} ml={1} />}
                                </Tag>
                              ))}
                            </HStack>
                          </Box>
                          
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">Benefit Details:</Text>
                            <Text fontSize="sm">{benefit.benefit_details}</Text>
                          </Box>
                          
                          <Box>
                            <Text fontWeight="bold" fontSize="sm">Valid Period:</Text>
                            <Text fontSize="sm">
                              {new Date(benefit.valid_from).toLocaleDateString()} - 
                              {benefit.valid_until ? new Date(benefit.valid_until).toLocaleDateString() : 'No expiration'}
                            </Text>
                          </Box>
                        </VStack>
                        
                        <Divider my={3} />
                        
                        <Flex justify="flex-end">
                          <Button 
                            colorScheme={benefit.eligible ? "purple" : "gray"} 
                            isDisabled={!benefit.eligible}
                            rightIcon={<FaExternalLinkAlt />}
                            onClick={() => window.open(benefit.redemption_url, '_blank')}
                          >
                            Redeem Benefit
                          </Button>
                        </Flex>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Module Detail Modal */}
        {selectedModule && (
          <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <Flex align="center">
                  {selectedModule.title}
                  <Badge ml={2} colorScheme={getLevelColor(selectedModule.level)}>
                    Level {selectedModule.level}
                  </Badge>
                </Flex>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text mb={4}>{selectedModule.description}</Text>
                
                <Box mb={4}>
                  <Heading size="sm" mb={2}>Topics Covered</Heading>
                  <HStack spacing={2} flexWrap="wrap">
                    {selectedModule.topics.map((topic, idx) => (
                      <Tag key={idx} colorScheme="blue" m={1}>{topic}</Tag>
                    ))}
                  </HStack>
                </Box>
                
                <Box mb={4}>
                  <Heading size="sm" mb={2}>Completion Requirements</Heading>
                  <Text>{selectedModule.completion_requirements}</Text>
                </Box>
                
                {moduleAction === 'continue' && (
                  <Box mt={4}>
                    <Heading size="sm" mb={2}>Update Your Progress</Heading>
                    <Text mb={3}>For demonstration purposes, you can manually update your progress:</Text>
                    <HStack spacing={3}>
                      <Button onClick={() => handleUpdateProgress(selectedModule.id, 25)}>25%</Button>
                      <Button onClick={() => handleUpdateProgress(selectedModule.id, 50)}>50%</Button>
                      <Button onClick={() => handleUpdateProgress(selectedModule.id, 75)}>75%</Button>
                      <Button onClick={() => handleUpdateProgress(selectedModule.id, 100)}>100%</Button>
                    </HStack>
                  </Box>
                )}
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Close
                </Button>
                {moduleAction === 'continue' && (
                  <Button 
                    colorScheme="green" 
                    onClick={() => handleCompleteModule(selectedModule.id)}
                    leftIcon={<FaTrophy />}
                  >
                    Complete & Claim NFT
                  </Button>
                )}
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </Container>
    </MainLayout>
  );
} 