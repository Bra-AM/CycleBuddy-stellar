import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Grid,
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
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';
import { FaLock, FaBrain, FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { stellarContractService } from '../../services/stellar/contractService';

// Define types to fix TypeScript errors
interface AIModel {
  id: string;
  name: string;
  version: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: 'Informational' | 'Advisory' | 'Alert';
  confidence: number;
  verified: boolean;
  timestamp: string;
  recommendations: string[];
  related_data_types: string[];
}

export default function AIHealthInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Load data on component mount
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get user insights
      const userInsights = await stellarContractService.getUserHealthInsights();
      setInsights(userInsights as Insight[]);

      // Get available AI models
      const models = await stellarContractService.getAvailableAIModels();
      setAvailableModels(models as AIModel[]);
      if (models.length > 0) {
        setSelectedModel(models[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load health insights data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!selectedModel) {
      toast({
        title: 'Please select a model',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setGenerating(true);
    try {
      // Call contract to generate insights
      const result = await stellarContractService.generateHealthInsights(selectedModel);
      if (result) {
        toast({
          title: 'Success',
          description: 'New health insights generated',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Reload data to show new insights
        await loadData();
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate insights',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenInsight = (insight: Insight) => {
    setSelectedInsight(insight);
    onOpen();
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'Informational':
        return 'blue';
      case 'Advisory':
        return 'yellow';
      case 'Alert':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'Informational':
        return FaInfoCircle;
      case 'Advisory':
        return FaExclamationTriangle;
      case 'Alert':
        return FaBell;
      default:
        return FaInfoCircle;
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="xl">AI-Powered Health Insights</Heading>
          <HStack>
            <Select
              width="250px"
              placeholder="Select AI model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              isDisabled={generating || availableModels.length === 0}
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} (v{model.version})
                </option>
              ))}
            </Select>
            <Button
              colorScheme="purple"
              leftIcon={generating ? <Spinner size="sm" /> : <FaBrain />}
              onClick={handleGenerateInsights}
              isLoading={generating}
              isDisabled={!selectedModel}
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

      {loading ? (
        <Flex justify="center" align="center" minH="300px">
          <Spinner size="xl" thickness="4px" color="purple.500" />
        </Flex>
      ) : insights.length === 0 ? (
        <Card p={6} textAlign="center" bg="gray.50">
          <CardBody>
            <VStack spacing={4}>
              <Icon as={FaBrain} boxSize={12} color="gray.400" />
              <Heading size="md">No Health Insights Yet</Heading>
              <Text>Generate your first insights by selecting an AI model and clicking the Generate button.</Text>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          {insights.map((insight) => (
            <Card key={insight.id} cursor="pointer" onClick={() => handleOpenInsight(insight)} transition="transform 0.2s" _hover={{ transform: 'translateY(-5px)' }}>
              <CardHeader pb={2}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">{insight.title}</Heading>
                  <Badge colorScheme={getBadgeColor(insight.insight_type)}>
                    {insight.insight_type}
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <Text noOfLines={3}>{insight.description}</Text>
              </CardBody>
              <Divider />
              <CardFooter pt={3}>
                <Flex width="100%" justify="space-between" align="center">
                  <HStack>
                    <Icon as={getInsightIcon(insight.insight_type)} color={`${getBadgeColor(insight.insight_type)}.500`} />
                    <Text fontSize="sm">Confidence: {insight.confidence}%</Text>
                  </HStack>
                  <Tooltip label={insight.verified ? "Verified by healthcare professional" : "Not verified"}>
                    <Badge colorScheme={insight.verified ? "green" : "gray"}>
                      {insight.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </Tooltip>
                </Flex>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      )}

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <Flex align="center">
                <Icon as={getInsightIcon(selectedInsight.insight_type)} mr={2} color={`${getBadgeColor(selectedInsight.insight_type)}.500`} />
                {selectedInsight.title}
                <Badge ml={2} colorScheme={getBadgeColor(selectedInsight.insight_type)}>
                  {selectedInsight.insight_type}
                </Badge>
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>{selectedInsight.description}</Text>
              
              {selectedInsight.recommendations.length > 0 && (
                <Box mb={4}>
                  <Heading size="sm" mb={2}>Recommendations</Heading>
                  <VStack align="stretch">
                    {selectedInsight.recommendations.map((rec, index) => (
                      <HStack key={index} bg="gray.50" p={2} borderRadius="md">
                        <Icon as={FaCheckCircle} color="green.500" />
                        <Text>{rec}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
              
              <Divider my={4} />
              
              <Grid templateColumns="1fr 1fr" gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">Confidence</Text>
                  <Text fontWeight="bold">{selectedInsight.confidence}%</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Generated On</Text>
                  <Text fontWeight="bold">{new Date(selectedInsight.timestamp).toLocaleDateString()}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Verification Status</Text>
                  <Badge colorScheme={selectedInsight.verified ? "green" : "gray"}>
                    {selectedInsight.verified ? "Verified by Professional" : "Not Verified"}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Related Data</Text>
                  <HStack mt={1} spacing={1}>
                    {selectedInsight.related_data_types.map((type, index) => (
                      <Tag key={index} size="sm">{type}</Tag>
                    ))}
                  </HStack>
                </Box>
              </Grid>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
} 