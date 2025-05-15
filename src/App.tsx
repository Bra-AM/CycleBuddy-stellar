import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import { SorobanReactProvider } from '@soroban-react/core';
import { freighter } from '@soroban-react/freighter';
import { testnetChainMetadata } from './config/soroban';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import { DeployContracts } from './pages/DeployContracts';
import TestContract from './pages/TestContract';
import { VerifyContracts } from './pages/VerifyContracts';
import DeployAndInitialize from './pages/DeployAndInitialize';
import DonationPage from './pages/features/DonationPage';
import RewardsPage from './pages/features/RewardsPage';
import DataSharingPage from './pages/features/DataSharingPage';
import AIHealthInsightsPage from './pages/features/AIHealthInsightsPage';
import NFTEducationPage from './pages/features/NFTEducationPage';
import ResearchMarketplacePage from './pages/features/ResearchMarketplacePage';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Services
import { authService } from './services/auth/authService';

// Test Components
import ContractTest from './tests/ContractTest';
import PasskeyTest from './tests/PasskeyTest';

// Advanced Stellar Features Placeholders
// const DonationPage = () => <Box p={8}>Donation Feature Page</Box>;
// const DataSharingPage = () => <Box p={8}>Data Sharing Feature Page</Box>;
// const RewardsPage = () => <Box p={8}>Rewards Feature Page</Box>;
const ZKValidationPage = () => <Box p={8}>ZK Validation Feature Page</Box>;
const DataMarketplacePage = () => <Box p={8}>Data Marketplace Feature Page</Box>;
const HealthAlertsPage = () => <Box p={8}>Health Alerts Feature Page</Box>;

const connectors = [freighter()];

function App() {
  useEffect(() => {
    // Initialize auth on app load
    const initAuth = async () => {
      await authService.initializeAuth();
    };

    initAuth();
  }, []);

  return (
    <SorobanReactProvider
      chains={[testnetChainMetadata]}
      activeChain={testnetChainMetadata}
      connectors={connectors}
      appName="CycleBuddy"
    >
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Test routes */}
            <Route path="/test/contract" element={<ContractTest />} />
            <Route path="/test/passkey" element={<PasskeyTest />} />
            <Route path="/test/contracts-check" element={<TestContract />} />
            <Route path="/test/verify-contracts" element={<VerifyContracts />} />
            <Route path="/test/deploy-initialize" element={<DeployAndInitialize />} />
            
            {/* Contract deployment route */}
            <Route path="/deploy" element={<DeployContracts />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* Advanced Stellar Features Routes */}
            <Route path="/features/donate" element={
              <ProtectedRoute>
                <DonationPage />
              </ProtectedRoute>
            } />
            <Route path="/features/share" element={
              <ProtectedRoute>
                <DataSharingPage />
              </ProtectedRoute>
            } />
            <Route path="/features/rewards" element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            } />
            <Route path="/features/validate" element={
              <ProtectedRoute>
                <ZKValidationPage />
              </ProtectedRoute>
            } />
            <Route path="/features/marketplace" element={
              <ProtectedRoute>
                <DataMarketplacePage />
              </ProtectedRoute>
            } />
            <Route path="/features/alerts" element={
              <ProtectedRoute>
                <HealthAlertsPage />
              </ProtectedRoute>
            } />
            
            {/* Breakthrough Features Routes */}
            <Route path="/features/ai-health-insights" element={
              <ProtectedRoute>
                <AIHealthInsightsPage />
              </ProtectedRoute>
            } />
            <Route path="/features/nft-education" element={
              <ProtectedRoute>
                <NFTEducationPage />
              </ProtectedRoute>
            } />
            <Route path="/features/research-marketplace" element={
              <ProtectedRoute>
                <ResearchMarketplacePage />
              </ProtectedRoute>
            } />
            
            {/* Redirect to home page by default */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Box>
      </Router>
    </SorobanReactProvider>
  );
}

export default App; 