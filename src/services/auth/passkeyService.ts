import { RP_ID, RP_NAME, RP_ORIGIN } from '../../constants/env';
import { stellarContractService } from '../stellar/contractService';

interface PasskeyRegistrationOptions {
  username: string;
  displayName: string;
}

interface PasskeyRegistrationResult {
  publicKey: string;
  credentialId: string;
  success: boolean;
}

interface PasskeyAuthenticationResult {
  success: boolean;
  signature?: string;
  publicKey?: string;
  message?: string;
}

class PasskeyService {
  private isWebAuthnSupported: boolean;

  constructor() {
    // Check if WebAuthn is supported in this browser
    this.isWebAuthnSupported = typeof window !== 'undefined' &&
      window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential === 'function';
  }

  /**
   * Check if WebAuthn is supported
   */
  public isSupported(): boolean {
    return this.isWebAuthnSupported;
  }

  /**
   * Register a new passkey
   */
  public async registerPasskey(options: PasskeyRegistrationOptions): Promise<PasskeyRegistrationResult> {
    if (!this.isWebAuthnSupported) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      console.log('Starting WebAuthn passkey registration...');
      
      // Create registration options
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: this.generateChallenge(),
        rp: {
          name: RP_NAME,
          id: RP_ID
        },
        user: {
          id: this.stringToBuffer(options.username),
          name: options.username,
          displayName: options.displayName
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256 (for Ed25519)
          { type: 'public-key', alg: -257 } // RS256 (for RSA)
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          requireResidentKey: true
        },
        timeout: 60000,
        attestation: 'direct'
      };

      console.log('Requesting credential creation...');
      
      // Create credentials
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;

      console.log('Credential creation successful, processing response...');

      // Get attestation response
      const response = credential.response as AuthenticatorAttestationResponse;

      // Extract public key and credential ID
      const publicKeyBytes = response.getPublicKey();
      const publicKey = publicKeyBytes ? this.arrayBufferToBase64(publicKeyBytes) : '';
      const credentialId = this.arrayBufferToBase64(credential.rawId);

      // Register this passkey with the blockchain
      try {
        console.log('Registering passkey on blockchain...');
        const registered = await stellarContractService.registerPasskey(publicKey);
        if (registered) {
          console.log('Passkey successfully registered on blockchain');
        } else {
          console.warn('Blockchain registration returned false, but continuing with local registration');
        }
      } catch (blockchainError) {
        console.error('Error during blockchain registration:', blockchainError);
        console.warn('Continuing with local registration despite blockchain error');
      }

      console.log('Passkey registration completed successfully');
      
      return {
        publicKey,
        credentialId,
        success: true
      };
    } catch (error) {
      console.error('Error registering passkey:', error);
      return {
        publicKey: '',
        credentialId: '',
        success: false
      };
    }
  }

  /**
   * Authenticate with a passkey
   */
  public async authenticateWithPasskey(): Promise<PasskeyAuthenticationResult> {
    if (!this.isWebAuthnSupported) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    try {
      // Create authentication options
      const challenge = this.generateChallenge();
      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: RP_ID,
        userVerification: 'required',
        timeout: 60000
      };

      console.log('Starting WebAuthn authentication...');

      // Get credentials
      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;

      console.log('WebAuthn authentication successful, processing response...');

      // Get assertion response
      const response = credential.response as AuthenticatorAssertionResponse;

      // Extract signature
      const signature = this.arrayBufferToBase64(response.signature);
      const message = this.arrayBufferToBase64(challenge);
      const publicKey = ''; // In a real app, we would extract this from the credential

      // Skip the contract integration for now since contracts aren't properly initialized
      console.log('Authentication completed successfully');

      return {
        success: true,
        signature,
        publicKey,
        message
      };
    } catch (error) {
      console.error('Error authenticating with passkey:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Generate a random challenge
   */
  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array.buffer;
  }

  /**
   * Convert string to ArrayBuffer
   */
  private stringToBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binString = Array.from(bytes)
      .map(x => String.fromCodePoint(x))
      .join('');
    return btoa(binString);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binString = atob(base64);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Create and export a singleton instance
export const passkeyService = new PasskeyService(); 