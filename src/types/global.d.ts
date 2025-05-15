declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

// WebAuthn related declarations
interface AuthenticatorAttestationResponse extends AuthenticatorResponse {
  getPublicKey(): ArrayBuffer | null;
}

// Add Freighter to the Window interface
interface Window {
  freighter?: any;
} 