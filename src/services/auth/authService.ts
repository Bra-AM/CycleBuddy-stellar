import { create } from 'zustand';
import { passkeyService } from './passkeyService';
import { stellarContractService } from '../stellar/contractService';

interface UserData {
  address: string;
  username: string;
  userType: 'parent' | 'teen';
  isLoggedIn: boolean;
}

interface AuthState {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<boolean>;
  register: (username: string, displayName: string, userType: 'parent' | 'teen') => Promise<boolean>;
  logout: () => void;
  connectWallet: () => Promise<boolean>;
  isWalletConnected: () => Promise<boolean>;
}

// Create a Zustand store for authentication state
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  
  login: async () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Starting login process...');
      
      // First ensure wallet is connected (this will work in simulated mode if Freighter isn't available)
      let isConnected = false;
      try {
        isConnected = await stellarContractService.isWalletConnected();
        if (!isConnected) {
          console.log('Wallet not connected, attempting to connect...');
          const connected = await stellarContractService.connectWallet();
          if (!connected) {
            console.error('Failed to connect wallet');
            set({ error: 'Failed to connect to wallet', isLoading: false });
            return false;
          }
          console.log('Wallet connected successfully');
        } else {
          console.log('Wallet already connected');
        }
      } catch (walletError) {
        console.warn('Wallet connection error, using simulated mode:', walletError);
        // Continue in simulated mode
      }
      
      console.log('Proceeding with passkey authentication...');
      
      // Authenticate with passkey
      const result = await passkeyService.authenticateWithPasskey();
      
      console.log('Passkey authentication result:', result.success);
      
      if (result.success) {
        // Get user's wallet address (will return simulated address if Freighter isn't available)
        console.log('Getting user public key...');
        const userAddress = await stellarContractService.getUserPublicKey();
        
        if (!userAddress) {
          console.error('Failed to get wallet address');
          set({ error: 'Failed to get wallet address', isLoading: false });
          return false;
        }
        
        console.log('Login successful, creating user session...');
        
        // In a real app, we would fetch user data from the blockchain
        const userData = {
          address: userAddress,
          username: 'User', // This would come from the blockchain
          userType: 'teen' as const, // This would come from the blockchain
          isLoggedIn: true
        };
        
        // Store authentication in localStorage
        localStorage.setItem('auth_token', 'authenticated');
        
        // Update state last to ensure everything else is done
        set({ user: userData, isLoading: false });
        console.log('Login process completed');
        
        return true;
      } else {
        console.error('Authentication failed');
        set({ error: 'Authentication failed', isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error during login', 
        isLoading: false 
      });
      return false;
    }
  },
  
  register: async (username: string, displayName: string, userType: 'parent' | 'teen') => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Starting registration process...');
      
      // First ensure wallet is connected (this will work in simulated mode if Freighter isn't available)
      let isConnected = false;
      try {
        isConnected = await stellarContractService.isWalletConnected();
        if (!isConnected) {
          console.log('Wallet not connected, attempting to connect...');
          const connected = await stellarContractService.connectWallet();
          if (!connected) {
            console.error('Failed to connect wallet');
            set({ error: 'Failed to connect to wallet', isLoading: false });
            return false;
          }
          console.log('Wallet connected successfully');
        } else {
          console.log('Wallet already connected');
        }
      } catch (walletError) {
        console.warn('Wallet connection error, using simulated mode:', walletError);
        // Continue in simulated mode
      }
      
      console.log('Registering passkey...');
      
      // Register a new passkey
      const result = await passkeyService.registerPasskey({
        username,
        displayName
      });
      
      console.log('Passkey registration result:', result.success);
      
      if (!result.success) {
        console.error('Failed to register passkey');
        set({ error: 'Failed to register passkey', isLoading: false });
        return false;
      }
      
      // Get user's wallet address (will return simulated address if Freighter isn't available)
      console.log('Getting user public key...');
      const userAddress = await stellarContractService.getUserPublicKey();
      
      if (!userAddress) {
        console.error('Failed to get wallet address');
        set({ error: 'Failed to get wallet address', isLoading: false });
        return false;
      }
      
      console.log('Registration successful, creating user account...');
      
      // In a real app, we would store additional user data on the blockchain
      const userData = {
        address: userAddress,
        username,
        userType,
        isLoggedIn: true
      };
      
      // Store authentication in localStorage
      localStorage.setItem('auth_token', 'authenticated');
      
      // Update state last to ensure everything else is done
      set({ user: userData, isLoading: false });
      console.log('Registration process completed');
      
      return true;
    } catch (error) {
      console.error('Error during registration:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error during registration', 
        isLoading: false 
      });
      return false;
    }
  },
  
  logout: () => {
    // Clear authentication data
    localStorage.removeItem('auth_token');
    set({ user: null });
  },
  
  connectWallet: async () => {
    try {
      return await stellarContractService.connectWallet();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to connect wallet' });
      return false;
    }
  },
  
  isWalletConnected: async () => {
    try {
      return await stellarContractService.isWalletConnected();
    } catch (error) {
      return false;
    }
  }
}));

// Helper to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('auth_token') !== null;
};

class AuthService {
  // Method to handle initial authentication check on app load
  public async initializeAuth(): Promise<boolean> {
    const authStore = useAuthStore.getState();
    
    // If user is already authenticated in the store, return true
    if (authStore.user?.isLoggedIn) {
      return true;
    }
    
    // Check for stored auth token
    if (localStorage.getItem('auth_token')) {
      // Make sure wallet is connected
      const isConnected = await authStore.isWalletConnected();
      if (!isConnected) {
        const connected = await authStore.connectWallet();
        if (!connected) {
          return false;
        }
      }
      
      // Get user's wallet address
      const userAddress = await stellarContractService.getUserPublicKey();
      
      if (userAddress) {
        // In a real app, we would fetch user data from the blockchain
        const userData = {
          address: userAddress,
          username: 'User', // This would come from the blockchain
          userType: 'teen' as const, // This would come from the blockchain
          isLoggedIn: true
        };
        
        useAuthStore.setState({ user: userData });
        return true;
      }
    }
    
    return false;
  }
}

export const authService = new AuthService(); 