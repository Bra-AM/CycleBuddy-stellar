const path = require('path');
const fs = require('fs');

/**
 * Helper function to securely load Google Cloud credentials
 * This separates credential management from application code
 */
function getGoogleCredentials() {
  // First try environment variable
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch (err) {
      console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', err);
    }
  }
  
  // Then try credential file
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'credential.json');
  if (fs.existsSync(credentialPath)) {
    try {
      return JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
    } catch (err) {
      console.error(`Error reading credentials from ${credentialPath}:`, err);
    }
  }
  
  // Return null if credentials not found
  console.warn('Google Cloud credentials not found');
  return null;
}

module.exports = {
  getGoogleCredentials
};
