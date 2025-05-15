import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  useToast,
  Link,
  Flex,
  Alert,
  AlertIcon,
  SimpleGrid,
  FormErrorMessage,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Logo } from '../../components/common/Logo';
import { useAuthStore } from '../../services/auth/authService';
import { passkeyService } from '../../services/auth/passkeyService';

// Create a keyframe animation for the gradient
const animatedGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, error } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  // Animated button style
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Check if WebAuthn is supported
      if (!passkeyService.isSupported()) {
        toast({
          title: 'Error',
          description: 'Your browser does not support passkeys. Please use a modern browser.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsSubmitting(false);
        return;
      }

      // Register with passkey
      const success = await register(username, email, 'teen');
      
      if (success) {
        toast({
          title: 'Registration successful',
          description: 'Your account has been created!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Registration failed',
          description: error || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Flex direction="column" align="center">
          <Logo size="lg" mb={4} />
          <Heading size="xl" mb={2}>Create Your Account</Heading>
          <Text color="gray.600">Track, Learn, and Connect with Privacy</Text>
        </Flex>

        {!passkeyService.isSupported() && (
          <Alert status="warning">
            <AlertIcon />
            Your browser might not support passkeys. For the best experience, use a modern browser.
          </Alert>
        )}

        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <form onSubmit={handleRegister}>
            <VStack spacing={4}>
              <FormControl id="username" isInvalid={!!errors.username}>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                />
                <FormErrorMessage>{errors.username}</FormErrorMessage>
              </FormControl>

              <FormControl id="email" isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <SimpleGrid columns={1} spacing={3} width="full" mt={4}>
                <Button
                  type="submit"
                  size="lg"
                  width="full"
                  isLoading={isSubmitting}
                  loadingText="Creating Account"
                  sx={animatedGradientStyle}
                >
                  Create Account with Passkey
                </Button>
              </SimpleGrid>
            </VStack>
          </form>
        </Box>

        <HStack pt={4}>
          <Text>Already have an account?</Text>
          <Link as={RouterLink} to="/login" color="#D53F8C">
            Sign in
          </Link>
        </HStack>
      </VStack>
    </Container>
  );
};

export default RegisterPage; 