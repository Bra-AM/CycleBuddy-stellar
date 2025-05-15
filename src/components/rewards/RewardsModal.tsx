import { 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Heading,
  Text,
  Flex,
  Divider,
  HStack,
  Badge,
  Box,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { passkeyService } from '../../services/auth/passkeyService';

interface Achievement {
  id: string;
  name: string;
  color: string;
}

interface NextAchievement {
  name: string;
  reward: string;
}

interface RewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableXLM: number;
}

const RewardsModal = ({ isOpen, onClose, availableXLM }: RewardsModalProps) => {
  const [claiming, setClaiming] = useState(false);
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setIsWebAuthnSupported(passkeyService.isSupported());
  }, []);

  const completedAchievements: Achievement[] = [
    { id: 'first-entry', name: 'FIRST ENTRY', color: 'green' },
    { id: '7-day', name: '7-DAY STREAK', color: 'purple' },
    { id: 'quiz', name: 'EDUCATIONAL QUIZ', color: 'blue' }
  ];

  const nextAchievements: NextAchievement[] = [
    { name: '30-Day Tracking Streak', reward: '+50 XLM' },
    { name: 'Complete Health Course', reward: '+30 XLM' }
  ];

  const handleClaimRewards = async () => {
    setClaiming(true);
    setAuthError(null);
    
    try {
      // Request fingerprint authentication
      const authResult = await passkeyService.authenticateWithPasskey();
      
      if (!authResult.success) {
        throw new Error("Authentication failed");
      }
      
      // If authentication successful, proceed with claiming rewards
      toast({
        title: 'Rewards Claimed',
        description: `${availableXLM} XLM has been added to your wallet!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error during authentication:', error);
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="purple.600" fontSize="2xl">Rewards Program</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Box>
              <Heading as="h3" size="sm" mb={1}>
                Available Rewards
              </Heading>
              <Heading as="h2" size="2xl" fontWeight="bold">
                {availableXLM} XLM
              </Heading>
              <Text color="gray.600">
                Earned from consistent tracking
              </Text>
            </Box>

            <Divider />

            <Box>
              <Heading as="h3" size="sm" mb={3}>
                Completed Achievements
              </Heading>
              <HStack spacing={2} flexWrap="wrap">
                {completedAchievements.map((achievement) => (
                  <Badge 
                    key={achievement.id}
                    colorScheme={achievement.color}
                    px={3}
                    py={1}
                    borderRadius="md"
                    fontSize="sm"
                  >
                    {achievement.name}
                  </Badge>
                ))}
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Heading as="h3" size="sm" mb={3}>
                Next Achievements
              </Heading>
              {nextAchievements.map((achievement, index) => (
                <Flex key={index} justify="space-between" mb={2}>
                  <Text>{achievement.name}</Text>
                  <Text fontWeight="bold">{achievement.reward}</Text>
                </Flex>
              ))}
            </Box>
            
            {authError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            {!isWebAuthnSupported && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription>Biometric authentication is not supported on this device.</AlertDescription>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme="purple"
            mr={3}
            onClick={handleClaimRewards}
            isLoading={claiming}
            loadingText="Authenticating..."
            isDisabled={availableXLM <= 0}
          >
            Claim Rewards
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RewardsModal; 