import React from 'react';
import { Box, Flex, HStack, Text, Button, Avatar, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../services/auth/authService';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Flex
        py={3}
        px={6}
        bg={bgColor}
        borderBottom="1px"
        borderColor={borderColor}
        alignItems="center"
        justifyContent="space-between"
      >
        <Text fontSize="lg" fontWeight="bold" color="purple.600">
          CycleBuddy
        </Text>
        <HStack>
          <Button colorScheme="red" variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
          <Avatar size="sm" name={user?.name || 'User'} />
        </HStack>
      </Flex>
      
      {/* Main Content */}
      <Box as="main" pt={4}>
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout; 