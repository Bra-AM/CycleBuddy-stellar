import { useState, useEffect } from 'react';
import { useSorobanReact } from '@soroban-react/core';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Avatar,
  Badge,
  Switch,
  FormControl,
  FormLabel,
  Stack,
  Icon,
  useColorModeValue,
  useToast
} from '@chakra-ui/react';
import { FaUserMd, FaUniversity, FaLock, FaShieldAlt } from 'react-icons/fa';
import Layout from '../../components/layout/Layout';
import FeaturePageTemplate from '../../components/common/FeaturePageTemplate';

const DataSharingPage = () => {
  const { server, address } = useSorobanReact();
  const [dataConnections, setDataConnections] = useState([
    { id: 1, name: 'Dr. Amanda Chen', type: 'Healthcare', status: 'connected', avatar: 'AC' },
    { id: 2, name: 'Research Institute', type: 'Research', status: 'pending', avatar: 'RI' },
  ]);
  const [privacySettings, setPrivacySettings] = useState({
    shareAnonymized: true,
    allowResearch: false,
    enableEncryption: true,
    notifyOnAccess: true,
  });
  
  const contractId = import.meta.env.VITE_DATA_SHARING_CONTRACT_ID;
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handlePrivacyToggle = (setting: keyof typeof privacySettings) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting]
    });
    
    toast({
      title: 'Settings updated',
      description: 'Your privacy preferences have been saved',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleConnectionAction = (id: number, action: 'approve' | 'revoke' | 'reject') => {
    if (action === 'approve') {
      setDataConnections(dataConnections.map(conn => 
        conn.id === id ? { ...conn, status: 'connected' } : conn
      ));
      toast({
        title: 'Connection approved',
        description: 'Data sharing connection has been approved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else if (action === 'revoke') {
      setDataConnections(dataConnections.map(conn => 
        conn.id === id ? { ...conn, status: 'revoked' } : conn
      ));
      toast({
        title: 'Connection revoked',
        description: 'Data sharing connection has been revoked',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } else if (action === 'reject') {
      setDataConnections(dataConnections.map(conn => 
        conn.id === id ? { ...conn, status: 'rejected' } : conn
      ));
      toast({
        title: 'Connection rejected',
        description: 'Data sharing request has been rejected',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const dataSharingContent = (
    <Box>
      <Heading as="h1" size="xl" mb={6}>Data Sharing Controls</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mb={8}>
        <Box>
          <Heading as="h2" size="md" mb={4}>Active Connections</Heading>
          <Stack spacing={4}>
            {dataConnections.map(connection => (
              <Card key={connection.id} bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                <CardHeader pb={2}>
                  <Flex align="center">
                    <Avatar size="sm" name={connection.name} bg="blue.500" mr={3} />
                    <Box flex="1">
                      <Flex justify="space-between" align="center">
                        <Heading size="sm">{connection.name}</Heading>
                        <Badge colorScheme={
                          connection.status === 'connected' ? 'green' : 
                          connection.status === 'pending' ? 'yellow' : 
                          connection.status === 'revoked' ? 'red' : 'gray'
                        }>
                          {connection.status}
                        </Badge>
                      </Flex>
                      <Text fontSize="xs" color="gray.500">{connection.type} Provider</Text>
                    </Box>
                  </Flex>
                </CardHeader>
                <CardBody pt={0}>
                  <Divider my={2} />
                  <Flex justify="flex-end" gap={2}>
                    {connection.status === 'pending' && (
                      <>
                        <Button 
                          size="xs" 
                          colorScheme="green" 
                          onClick={() => handleConnectionAction(connection.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="xs" 
                          colorScheme="red" 
                          variant="outline" 
                          onClick={() => handleConnectionAction(connection.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {connection.status === 'connected' && (
                      <Button 
                        size="xs" 
                        colorScheme="red" 
                        variant="outline"
                        onClick={() => handleConnectionAction(connection.id, 'revoke')}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Stack>
          
          <Button colorScheme="blue" size="sm" mt={4} leftIcon={<Icon as={FaLock} />}>
            Add New Connection
          </Button>
        </Box>
        
        <Box>
          <Heading as="h2" size="md" mb={4}>Privacy Settings</Heading>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
            <CardBody>
              <Stack spacing={4}>
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel htmlFor="anonymized-data" mb={0} cursor="pointer">
                      <Flex align="center">
                        <Icon as={FaShieldAlt} mr={2} color="blue.500" />
                        <Text>Share Anonymized Data</Text>
                      </Flex>
                      <Text fontSize="xs" color="gray.500">Allow sharing of anonymized data for research</Text>
                    </FormLabel>
                  </Box>
                  <Switch 
                    id="anonymized-data" 
                    isChecked={privacySettings.shareAnonymized}
                    onChange={() => handlePrivacyToggle('shareAnonymized')}
                    colorScheme="blue"
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel htmlFor="research" mb={0} cursor="pointer">
                      <Flex align="center">
                        <Icon as={FaUniversity} mr={2} color="purple.500" />
                        <Text>Research Participation</Text>
                      </Flex>
                      <Text fontSize="xs" color="gray.500">Participate in health research studies</Text>
                    </FormLabel>
                  </Box>
                  <Switch 
                    id="research" 
                    isChecked={privacySettings.allowResearch}
                    onChange={() => handlePrivacyToggle('allowResearch')}
                    colorScheme="purple"
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel htmlFor="encryption" mb={0} cursor="pointer">
                      <Flex align="center">
                        <Icon as={FaLock} mr={2} color="green.500" />
                        <Text>End-to-End Encryption</Text>
                      </Flex>
                      <Text fontSize="xs" color="gray.500">Encrypt all shared data</Text>
                    </FormLabel>
                  </Box>
                  <Switch 
                    id="encryption" 
                    isChecked={privacySettings.enableEncryption}
                    onChange={() => handlePrivacyToggle('enableEncryption')}
                    colorScheme="green"
                  />
                </FormControl>
                
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel htmlFor="notifications" mb={0} cursor="pointer">
                      <Flex align="center">
                        <Icon as={FaUserMd} mr={2} color="orange.500" />
                        <Text>Access Notifications</Text>
                      </Flex>
                      <Text fontSize="xs" color="gray.500">Get notified when your data is accessed</Text>
                    </FormLabel>
                  </Box>
                  <Switch 
                    id="notifications" 
                    isChecked={privacySettings.notifyOnAccess}
                    onChange={() => handlePrivacyToggle('notifyOnAccess')}
                    colorScheme="orange"
                  />
                </FormControl>
              </Stack>
            </CardBody>
          </Card>
          
          <Heading as="h3" size="sm" mt={6} mb={2}>Blockchain Privacy</Heading>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="sm">
            <CardBody>
              <Text mb={4}>
                Your data is secured on the Stellar blockchain. All sharing permissions are enforced through smart contracts, ensuring your data can only be accessed by authorized parties.
              </Text>
              <Button colorScheme="blue" size="sm" variant="outline">
                View Blockchain Records
              </Button>
            </CardBody>
          </Card>
        </Box>
      </SimpleGrid>
    </Box>
  );
  
  return (
    <Layout>
      <FeaturePageTemplate 
        contractId={contractId}
        featureName="Data Sharing"
        simulated={true} // Force simulation mode until contract is properly working
      >
        {dataSharingContent}
      </FeaturePageTemplate>
    </Layout>
  );
};

export default DataSharingPage; 