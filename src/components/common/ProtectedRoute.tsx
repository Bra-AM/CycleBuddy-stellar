import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../services/auth/authService';
import { Box, Spinner, Center } from '@chakra-ui/react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      // We're using a timeout here to simulate the auth check
      // In a real app, this might be an actual API call or token verification
      setTimeout(() => setChecking(false), 500);
    };

    checkAuth();
  }, []);

  if (checking || isLoading) {
    return (
      <Center h="100vh">
        <Spinner 
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="teal.500"
          size="xl"
        />
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!user?.isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute; 