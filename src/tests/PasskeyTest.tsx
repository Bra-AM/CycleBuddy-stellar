import React, { useState } from 'react';
import { passkeyService } from '../services/auth/passkeyService';

const PasskeyTest: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean>(
    passkeyService.isSupported()
  );
  const [registrationResult, setRegistrationResult] = useState<string>('');
  const [authResult, setAuthResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');

  const handleRegister = async () => {
    if (!username || !displayName) {
      setError('Username and display name are required');
      return;
    }

    try {
      setError(null);
      const result = await passkeyService.registerPasskey({
        username,
        displayName,
      });

      setRegistrationResult(
        result.success
          ? `Registration successful! Public Key: ${result.publicKey.substring(0, 20)}...`
          : 'Registration failed'
      );
    } catch (err) {
      console.error('Error registering passkey:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAuthenticate = async () => {
    try {
      setError(null);
      const result = await passkeyService.authenticateWithPasskey();

      setAuthResult(
        result.success
          ? `Authentication successful! Signature: ${
              result.signature?.substring(0, 20) || ''
            }...`
          : 'Authentication failed'
      );
    } catch (err) {
      console.error('Error authenticating with passkey:', err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">WebAuthn Test</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Error:</strong> WebAuthn is not supported in this browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">WebAuthn/Passkey Test</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Register a Passkey</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Username:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Display Name:
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          onClick={handleRegister}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Register Passkey
        </button>
        {registrationResult && (
          <div className="mt-2 text-green-600">{registrationResult}</div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">
          Authenticate with Passkey
        </h3>
        <button
          onClick={handleAuthenticate}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Authenticate
        </button>
        {authResult && <div className="mt-2 text-green-600">{authResult}</div>}
      </div>
    </div>
  );
};

export default PasskeyTest; 