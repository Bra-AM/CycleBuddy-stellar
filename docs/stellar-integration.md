# Stellar Integration Guide

This document explains how to properly integrate the Stellar blockchain with the CycleBuddy application.

## Prerequisites

Before starting, make sure you have:

1. [Freighter Wallet](https://www.freighter.app/) installed and set up
2. A Stellar testnet account funded with XLM
3. Stellar CLI installed (`npm install -g @stellar/cli`)

## Deploying Contracts

The application requires four smart contracts:

1. **Registry Contract**: Central contract that tracks the addresses of other contracts
2. **Auth Contract**: Handles authentication and passkey validation
3. **Data Contract**: Stores encrypted health data
4. **Community Contract**: Manages community features

### Step 1: Set up the development environment

Run the setup script to prepare your development environment:

```bash
./scripts/setup-dev-env.sh
```

### Step 2: Deploy the contracts to testnet

Run the deployment script to deploy placeholder token contracts:

```bash
./scripts/deploy-contracts.sh
```

When prompted, enter your Stellar public key (starts with G).

This script will:
1. Deploy four token contracts as placeholders
2. Save the contract IDs to a `.env` file
3. Configure the application to use these contract IDs

> **Note**: In this demo, we're using Stellar token contracts as placeholders. In a production environment, you would deploy the actual contracts from the `contracts/` directory.

### Step 3: Start the application

Start the application with the deployed contracts:

```bash
./scripts/start-app.sh
```

## Debugging Contract Issues

If you encounter issues with the contracts:

1. Check the console logs for specific error messages
2. Verify your Freighter wallet is connected and unlocked
3. Ensure your testnet account has sufficient XLM
4. Check that the contract IDs in `.env` are valid

## Simulated vs. Real Mode

The application can operate in two modes:

1. **Simulated Mode**: When Freighter is not available, the app simulates blockchain interactions
2. **Real Mode**: When Freighter is connected, the app interacts with actual contracts on testnet

To force simulated mode, you can temporarily disable your Freighter wallet extension.

## Building Custom Contracts

To build custom contracts for the application:

1. Navigate to the contract directory: `cd contracts/registry`
2. Build the contract: `cargo build --target wasm32-unknown-unknown --release`
3. Optimize the WASM file (requires `soroban-cli`):
   ```bash
   soroban contract optimize --wasm target/wasm32-unknown-unknown/release/registry_contract.wasm
   ```
4. Deploy the optimized contract using the Stellar CLI

## Testing Contract Interactions

You can test contract interactions using the Stellar CLI:

```bash
# Example: Get a contract
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account freighter \
  -- \
  get_contract \
  --contract_type 0
```

## Troubleshooting

### Invalid Contract ID Error

If you encounter "Invalid contract ID" errors:

1. Re-run the `deploy-contracts.sh` script
2. Check that the contract IDs in `.env` are valid
3. Restart the application

### Wallet Connection Issues

If you have trouble connecting to your wallet:

1. Make sure Freighter is installed and unlocked
2. Switch to the Stellar testnet network in Freighter
3. Ensure your account has sufficient XLM balance

### Contract Compilation Errors

If contract compilation fails:

1. Check the Rust code for syntax errors
2. Verify that you have the correct version of Rust and its toolchain
3. Run `cargo check` to identify specific issues 