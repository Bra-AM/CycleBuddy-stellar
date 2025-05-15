import { ReactNode } from 'react';
import { Box, Flex, Container, Link, Heading, Icon, Text, Button, useColorModeValue } from '@chakra-ui/react';
import { FaHome, FaCoins, FaHandHoldingHeart, FaShareAlt, FaShieldAlt } from 'react-icons/fa';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useSorobanReact } from '@soroban-react/core';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { address, connect } = useSorobanReact();
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isActive = (path: string) => location.pathname === path;

  const handleConnect = async () => {
    if (connect) {
      await connect();
    }
  };

  const featureLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: FaHome },
    { name: 'Rewards', path: '/features/rewards', icon: FaCoins },
    { name: 'Donations', path: '/features/donate', icon: FaHandHoldingHeart },
    { name: 'Data Sharing', path: '/features/share', icon: FaShareAlt },
    { name: 'Validation', path: '/features/validate', icon: FaShieldAlt },
  ];

  return (
    <Box minH="100vh" bg={bgColor}>
      <Box as="header" borderBottom="1px" borderColor={borderColor} bg="white" position="fixed" w="full" zIndex={10}>
        <Container maxW="container.xl" py={3}>
          <Flex justify="space-between" align="center">
            <Flex align="center">
              <Heading size="md" mr={10}>CycleBuddy</Heading>
              <Flex display={{ base: 'none', md: 'flex' }}>
                {featureLinks.map((link) => (
                  <Link
                    key={link.path}
                    as={RouterLink}
                    to={link.path}
                    px={3}
                    py={2}
                    rounded="md"
                    fontWeight="medium"
                    color={isActive(link.path) ? 'blue.600' : 'gray.600'}
                    bg={isActive(link.path) ? 'blue.50' : 'transparent'}
                    _hover={{ color: 'blue.600', bg: 'blue.50' }}
                    display="flex"
                    alignItems="center"
                    mr={2}
                  >
                    <Icon as={link.icon} mr={2} />
                    {link.name}
                  </Link>
                ))}
              </Flex>
            </Flex>
            
            <Box>
              {address ? (
                <Text fontSize="sm">
                  {address.substring(0, 8)}...{address.substring(address.length - 4)}
                </Text>
              ) : (
                <Button size="sm" colorScheme="blue" onClick={handleConnect}>
                  Connect Wallet
                </Button>
              )}
            </Box>
          </Flex>
        </Container>
      </Box>
      
      <Box as="main" pt="70px" pb={10}>
        {children}
      </Box>
      
      <Box as="footer" borderTop="1px" borderColor={borderColor} py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color="gray.500">© 2023 CycleBuddy. All rights reserved.</Text>
            <Flex>
              <Link as={RouterLink} to="/test/verify-contracts" color="gray.500" fontSize="sm" mr={4}>
                Verify Contracts
              </Link>
              <Link as={RouterLink} to="/test/deploy-initialize" color="gray.500" fontSize="sm">
                Deployment Guide
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 