import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // DEVELOPMENT MODE: Always render children without authentication check
  return <>{children}</>;
};

export default ProtectedRoute;