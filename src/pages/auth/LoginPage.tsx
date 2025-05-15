import { useState, useEffect } from 'react';
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
  AlertTitle,
  AlertDescription,
  useColorModeValue,
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

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [longOperation, setLongOperation] = useState(false);
  const { login, error } = useAuthStore();
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

  // Add a timeout effect to detect long-running operations
  useEffect(() => {
    let timeoutId: number;
    
    if (isSubmitting) {
      timeoutId = window.setTimeout(() => {
        setLongOperation(true);
      }, 5000); // Show "taking longer than expected" after 5 seconds
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isSubmitting]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLongOperation(false);

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

      console.log('Starting login process from UI...');
      
      // Login with passkey
      const success = await login();

      console.log('Login process completed with result:', success);
      
      if (success) {
        toast({
          title: 'Login successful',
          description: 'Welcome back to CycleBuddy!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Login failed',
          description: error || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Caught error during login:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
      setLongOperation(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Flex direction="column" align="center">
          <Logo size="lg" mb={4} />
          <Heading size="xl" mb={2}>Welcome Back</Heading>
          <Text color="gray.600">Know your body, Own your cycle</Text>
        </Flex>

        {longOperation && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Taking longer than expected</AlertTitle>
              <AlertDescription>
                The login process is taking longer than expected. This might be due to network issues or browser permissions.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Box w="100%" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
          <form onSubmit={handleLogin}>
            <VStack spacing={4}>
              {/* <FormControl id="username">
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </FormControl> */}

              <Button
                type="submit"
                size="lg"
                width="full"
                isLoading={isSubmitting}
                loadingText={longOperation ? "Still working..." : "Signing In"}
                mt={4}
                sx={animatedGradientStyle}
              >
                Sign In with Passkey
              </Button>
            </VStack>
          </form>
        </Box>

        <HStack pt={4}>
          <Text>Don't have an account?</Text>
          <Link as={RouterLink} to="/register" color="#D53F8C">
            Register now
          </Link>
        </HStack>
      </VStack>
    </Container>
  );
};

export default LoginPage; 