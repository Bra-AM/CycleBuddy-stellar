import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Heading, VStack, Button, Text, Container, Image } from '@chakra-ui/react';

const IndexPage: React.FC = () => {
  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6} align="center">
        <Box textAlign="center" mb={6}>
          <Heading as="h1" size="2xl" mb={2}>
            CycleBuddy
          </Heading>
          <Text fontSize="xl" color="gray.600">
            A Web3-powered menstrual health companion
          </Text>
        </Box>

        <Box w="100%" p={5} boxShadow="md" borderRadius="md" bg="white">
          <Heading as="h2" size="lg" mb={4}>
            Test Components
          </Heading>
          <VStack spacing={4} align="stretch">
            <Link to="/test/contract">
              <Button colorScheme="blue" size="lg" width="100%">
                Stellar Contract Test
              </Button>
            </Link>
            <Link to="/test/passkey">
              <Button colorScheme="pink" size="lg" width="100%">
                WebAuthn/Passkey Test
              </Button>
            </Link>
          </VStack>
        </Box>

        <Box w="100%" p={5} boxShadow="md" borderRadius="md" bg="white">
          <Heading as="h2" size="lg" mb={4}>
            Main Application
          </Heading>
          <VStack spacing={4} align="stretch">
            <Link to="/login">
              <Button colorScheme="teal" size="lg" width="100%">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button colorScheme="teal" variant="outline" size="lg" width="100%">
                Register
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button colorScheme="purple" size="lg" width="100%">
                Dashboard
              </Button>
            </Link>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default IndexPage; 