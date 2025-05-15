#!/bin/bash

echo "CycleBuddy - Starting Application"
echo "================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Run the deploy-contracts.sh script first."
    exit 1
fi

# Load the .env file
source .env

# Display the contract IDs
echo "Using the following contract IDs:"
echo "Registry Contract: $VITE_REGISTRY_CONTRACT_ID"
echo "Auth Contract: $VITE_AUTH_CONTRACT_ID"
echo "Data Contract: $VITE_DATA_CONTRACT_ID"
echo "Community Contract: $VITE_COMMUNITY_CONTRACT_ID"
echo ""

# Restart the application
echo "Starting the application..."
npm run dev 