#!/bin/bash

echo "CycleBuddy - Stellar Development Environment Setup"
echo "=================================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install it first."
    echo "Installation instructions: https://nodejs.org/"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install it first."
    echo "It usually comes with Node.js: https://nodejs.org/"
    exit 1
fi

echo "Installing project dependencies..."
npm install

# Check for Stellar CLI
if ! command -v stellar &> /dev/null; then
    echo "Stellar CLI not found. Would you like to install it? (y/n)"
    read -r install_stellar
    
    if [[ $install_stellar == "y" || $install_stellar == "Y" ]]; then
        echo "Installing Stellar CLI..."
        npm install -g @stellar/cli
        
        # Check if installation was successful
        if ! command -v stellar &> /dev/null; then
            echo "Failed to install Stellar CLI. Please install it manually."
            echo "Installation instructions: https://developers.stellar.org/docs/tools/developer-tools/stellar-cli"
            exit 1
        fi
    else
        echo "Skipping Stellar CLI installation."
        echo "You will need Stellar CLI to deploy contracts. Install it with:"
        echo "npm install -g @stellar/cli"
    fi
else
    echo "Stellar CLI already installed."
fi

# Set up Stellar network
echo ""
echo "Setting up Stellar testnet..."
stellar network use testnet

echo ""
echo "Setup complete! You're ready to develop with Stellar."
echo ""
echo "Next steps:"
echo "1. Install Freighter wallet: https://www.freighter.app/"
echo "2. Fund your testnet account: https://laboratory.stellar.org/#account-creator?network=test"
echo "3. Deploy contracts with: ./scripts/deploy-contracts.sh"
echo ""
echo "Happy coding!" 