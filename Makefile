# CycleBuddy Stellar Contracts Makefile
# ======================================
# 
# This Makefile provides commands for building, testing, and deploying Stellar Soroban contracts
# for the CycleBuddy application. It has replaced individual deployment scripts for a more
# streamlined workflow.
#
# Usage:
#   make build           - Build all contracts
#   make test            - Run all contract tests
#   make clean           - Clean build artifacts
#   make deploy          - Deploy contracts to testnet using soroban CLI
#   make deploy-save     - Deploy using new stellar CLI and save IDs to .env file
#   make optimize        - Optimize compiled contracts
#   make bindings        - Generate TypeScript bindings
#   make get-token-contract - Download Soroban token contract

# Stellar configuration
STELLAR_ADDRESS ?= GBUKOFF6FX6767LKKOD3P7KAS43I3Z7CNUBPCH33YZKPPR53ZDHAHCER
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
RPC_URL = https://soroban-testnet.stellar.org

# Contract names and their WASM file names
REGISTRY_WASM = registry_contract.wasm
AUTH_WASM = cyclebuddy_auth_contract.wasm
DATA_WASM = cyclebuddy_data_contract.wasm
COMMUNITY_WASM = cyclebuddy_community_contract.wasm
DONATION_WASM = donation_contract.wasm
DATA_SHARING_WASM = data_sharing_contract.wasm
REWARDS_WASM = rewards_contract.wasm
ZK_VALIDATION_WASM = zk_validation_contract.wasm
DATA_MARKETPLACE_WASM = data_marketplace_contract.wasm
HEALTH_ALERTS_WASM = health_alerts_contract.wasm

# Output paths for public directory
PUBLIC_CONTRACTS_DIR = public/contracts

# SDK Version
SOROBAN_SDK_VERSION = 20.5.0

.PHONY: build test clean deploy optimize copy-to-public deploy-save bindings get-token-contract

# Build all contracts
build:
	@echo "Building all contracts..."
	@cd contracts && \
	cargo build --target wasm32-unknown-unknown --release
	@mkdir -p $(PUBLIC_CONTRACTS_DIR)
	@cp contracts/target/wasm32-unknown-unknown/release/$(REGISTRY_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(AUTH_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(DATA_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(COMMUNITY_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(DONATION_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(DATA_SHARING_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(REWARDS_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(ZK_VALIDATION_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(DATA_MARKETPLACE_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@cp contracts/target/wasm32-unknown-unknown/release/$(HEALTH_ALERTS_WASM) $(PUBLIC_CONTRACTS_DIR)/
	@echo "Contracts built and copied to $(PUBLIC_CONTRACTS_DIR)/"

# Test all contracts
test:
	@echo "Running all tests..."
	@cd contracts && \
	cargo test

# Clean all build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@cd contracts && \
	cargo clean
	@rm -rf $(PUBLIC_CONTRACTS_DIR)
	@echo "Cleaned build artifacts and $(PUBLIC_CONTRACTS_DIR)/"

# Deploy contracts to testnet using soroban CLI
deploy: build
	@echo "Deploying contracts to Stellar testnet..."
	@mkdir -p .soroban/deployed
	
	@echo "\nDeploying Registry contract..."
	@REGISTRY_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(REGISTRY_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Registry Contract ID: $$REGISTRY_ID" && \
	echo $$REGISTRY_ID > .soroban/deployed/registry_id.txt
	
	@echo "\nDeploying Auth contract..."
	@AUTH_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(AUTH_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Auth Contract ID: $$AUTH_ID" && \
	echo $$AUTH_ID > .soroban/deployed/auth_id.txt
	
	@echo "\nDeploying Data contract..."
	@DATA_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(DATA_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Data Contract ID: $$DATA_ID" && \
	echo $$DATA_ID > .soroban/deployed/data_id.txt
	
	@echo "\nDeploying Community contract..."
	@COMMUNITY_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(COMMUNITY_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Community Contract ID: $$COMMUNITY_ID" && \
	echo $$COMMUNITY_ID > .soroban/deployed/community_id.txt
	
	@echo "\nDeploying Donation contract..."
	@DONATION_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(DONATION_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Donation Contract ID: $$DONATION_ID" && \
	echo $$DONATION_ID > .soroban/deployed/donation_id.txt
	
	@echo "\nDeploying Data Sharing contract..."
	@DATA_SHARING_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(DATA_SHARING_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Data Sharing Contract ID: $$DATA_SHARING_ID" && \
	echo $$DATA_SHARING_ID > .soroban/deployed/data_sharing_id.txt
	
	@echo "\nDeploying Rewards contract..."
	@REWARDS_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(REWARDS_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Rewards Contract ID: $$REWARDS_ID" && \
	echo $$REWARDS_ID > .soroban/deployed/rewards_id.txt
	
	@echo "\nDeploying ZK Validation contract..."
	@ZK_VALIDATION_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(ZK_VALIDATION_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "ZK Validation Contract ID: $$ZK_VALIDATION_ID" && \
	echo $$ZK_VALIDATION_ID > .soroban/deployed/zk_validation_id.txt
	
	@echo "\nDeploying Data Marketplace contract..."
	@DATA_MARKETPLACE_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(DATA_MARKETPLACE_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Data Marketplace Contract ID: $$DATA_MARKETPLACE_ID" && \
	echo $$DATA_MARKETPLACE_ID > .soroban/deployed/data_marketplace_id.txt
	
	@echo "\nDeploying Health Alerts contract..."
	@HEALTH_ALERTS_ID=$$(soroban contract deploy \
		--wasm contracts/target/wasm32-unknown-unknown/release/$(HEALTH_ALERTS_WASM) \
		--source-account $(STELLAR_ADDRESS) \
		--network-passphrase $(NETWORK_PASSPHRASE) \
		--rpc-url $(RPC_URL)) && \
	echo "Health Alerts Contract ID: $$HEALTH_ALERTS_ID" && \
	echo $$HEALTH_ALERTS_ID > .soroban/deployed/health_alerts_id.txt
	
	@echo "\nCreating .env file with contract addresses..."
	@echo "VITE_STELLAR_NETWORK=testnet" > .env
	@echo "VITE_STELLAR_RPC_URL=$(RPC_URL)" >> .env
	@echo "VITE_HORIZON_URL=https://horizon-testnet.stellar.org" >> .env
	@echo "VITE_REGISTRY_CONTRACT_ID=$$(cat .soroban/deployed/registry_id.txt)" >> .env
	@echo "VITE_AUTH_CONTRACT_ID=$$(cat .soroban/deployed/auth_id.txt)" >> .env
	@echo "VITE_DATA_CONTRACT_ID=$$(cat .soroban/deployed/data_id.txt)" >> .env
	@echo "VITE_COMMUNITY_CONTRACT_ID=$$(cat .soroban/deployed/community_id.txt)" >> .env
	@echo "VITE_DONATION_CONTRACT_ID=$$(cat .soroban/deployed/donation_id.txt)" >> .env
	@echo "VITE_DATA_SHARING_CONTRACT_ID=$$(cat .soroban/deployed/data_sharing_id.txt)" >> .env
	@echo "VITE_REWARDS_CONTRACT_ID=$$(cat .soroban/deployed/rewards_id.txt)" >> .env
	@echo "VITE_ZK_VALIDATION_CONTRACT_ID=$$(cat .soroban/deployed/zk_validation_id.txt)" >> .env
	@echo "VITE_DATA_MARKETPLACE_CONTRACT_ID=$$(cat .soroban/deployed/data_marketplace_id.txt)" >> .env
	@echo "VITE_HEALTH_ALERTS_CONTRACT_ID=$$(cat .soroban/deployed/health_alerts_id.txt)" >> .env
	@echo "VITE_RP_ID=localhost" >> .env
	@echo "VITE_RP_NAME=CycleBuddy" >> .env
	@echo "VITE_RP_ORIGIN=http://localhost:3000" >> .env
	
	@echo "\nDeployment complete! Contract IDs have been saved to .env file:"
	@echo "Registry Contract ID: $$(cat .soroban/deployed/registry_id.txt)"
	@echo "Auth Contract ID: $$(cat .soroban/deployed/auth_id.txt)"
	@echo "Data Contract ID: $$(cat .soroban/deployed/data_id.txt)"
	@echo "Community Contract ID: $$(cat .soroban/deployed/community_id.txt)"
	@echo "Donation Contract ID: $$(cat .soroban/deployed/donation_id.txt)"
	@echo "Data Sharing Contract ID: $$(cat .soroban/deployed/data_sharing_id.txt)"
	@echo "Rewards Contract ID: $$(cat .soroban/deployed/rewards_id.txt)"
	@echo "ZK Validation Contract ID: $$(cat .soroban/deployed/zk_validation_id.txt)"
	@echo "Data Marketplace Contract ID: $$(cat .soroban/deployed/data_marketplace_id.txt)"
	@echo "Health Alerts Contract ID: $$(cat .soroban/deployed/health_alerts_id.txt)"

# Default target
all: build

# Optimize the contracts
optimize: build
	@echo "Optimizing contracts..."
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(REGISTRY_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(AUTH_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(COMMUNITY_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(DONATION_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_SHARING_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(REWARDS_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(ZK_VALIDATION_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_MARKETPLACE_WASM)
	@stellar contract optimize --wasm $(PUBLIC_CONTRACTS_DIR)/$(HEALTH_ALERTS_WASM)
	@echo "Contracts optimized!"

# Deploy using stellar CLI and save IDs
deploy-save: build
	@echo "Deploying contracts to Stellar testnet and saving IDs to .env..."
	@echo "Using Stellar address: $(STELLAR_ADDRESS)"
	@stellar network use testnet
	
	@echo "\nDeploying Registry contract..."
	@REGISTRY_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(REGISTRY_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Registry Contract ID: $$REGISTRY_ID" && \
	
	@echo "\nDeploying Auth contract..."
	@AUTH_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(AUTH_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Auth Contract ID: $$AUTH_ID" && \
	
	@echo "\nDeploying Data contract..."
	@DATA_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Data Contract ID: $$DATA_ID" && \
	
	@echo "\nDeploying Community contract..."
	@COMMUNITY_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(COMMUNITY_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Community Contract ID: $$COMMUNITY_ID" && \
	
	@echo "\nDeploying Donation contract..."
	@DONATION_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(DONATION_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Donation Contract ID: $$DONATION_ID" && \
	
	@echo "\nDeploying Data Sharing contract..."
	@DATA_SHARING_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_SHARING_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Data Sharing Contract ID: $$DATA_SHARING_ID" && \
	
	@echo "\nDeploying Rewards contract..."
	@REWARDS_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(REWARDS_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Rewards Contract ID: $$REWARDS_ID" && \
	
	@echo "\nDeploying ZK Validation contract..."
	@ZK_VALIDATION_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(ZK_VALIDATION_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "ZK Validation Contract ID: $$ZK_VALIDATION_ID" && \
	
	@echo "\nDeploying Data Marketplace contract..."
	@DATA_MARKETPLACE_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_MARKETPLACE_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Data Marketplace Contract ID: $$DATA_MARKETPLACE_ID" && \
	
	@echo "\nDeploying Health Alerts contract..."
	@HEALTH_ALERTS_ID=$$(stellar contract deploy --wasm $(PUBLIC_CONTRACTS_DIR)/$(HEALTH_ALERTS_WASM) --source $(STELLAR_ADDRESS)) && \
	echo "Health Alerts Contract ID: $$HEALTH_ALERTS_ID" && \
	
	@echo "\nCreating .env file with contract addresses..." && \
	echo "VITE_STELLAR_NETWORK=testnet" > .env && \
	echo "VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org" >> .env && \
	echo "VITE_HORIZON_URL=https://horizon-testnet.stellar.org" >> .env && \
	echo "VITE_REGISTRY_CONTRACT_ID=$$REGISTRY_ID" >> .env && \
	echo "VITE_AUTH_CONTRACT_ID=$$AUTH_ID" >> .env && \
	echo "VITE_DATA_CONTRACT_ID=$$DATA_ID" >> .env && \
	echo "VITE_COMMUNITY_CONTRACT_ID=$$COMMUNITY_ID" >> .env && \
	echo "VITE_DONATION_CONTRACT_ID=$$DONATION_ID" >> .env && \
	echo "VITE_DATA_SHARING_CONTRACT_ID=$$DATA_SHARING_ID" >> .env && \
	echo "VITE_REWARDS_CONTRACT_ID=$$REWARDS_ID" >> .env && \
	echo "VITE_ZK_VALIDATION_CONTRACT_ID=$$ZK_VALIDATION_ID" >> .env && \
	echo "VITE_DATA_MARKETPLACE_CONTRACT_ID=$$DATA_MARKETPLACE_ID" >> .env && \
	echo "VITE_HEALTH_ALERTS_CONTRACT_ID=$$HEALTH_ALERTS_ID" >> .env && \
	echo "VITE_RP_ID=localhost" >> .env && \
	echo "VITE_RP_NAME=CycleBuddy" >> .env && \
	echo "VITE_RP_ORIGIN=http://localhost:3000" >> .env && \
	echo "VITE_SIMULATION_MODE=false" >> .env && \
	
	@echo "\nDeployment complete! Contract IDs have been saved to .env file."

# Generate TypeScript bindings
bindings: build
	@echo "Generating TypeScript bindings..."
	@mkdir -p src/bindings
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(REGISTRY_WASM) \
		--output-dir ./src/bindings/registry \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(AUTH_WASM) \
		--output-dir ./src/bindings/auth \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_WASM) \
		--output-dir ./src/bindings/data \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(COMMUNITY_WASM) \
		--output-dir ./src/bindings/community \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(DONATION_WASM) \
		--output-dir ./src/bindings/donation \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_SHARING_WASM) \
		--output-dir ./src/bindings/data-sharing \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(REWARDS_WASM) \
		--output-dir ./src/bindings/rewards \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(ZK_VALIDATION_WASM) \
		--output-dir ./src/bindings/zk-validation \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(DATA_MARKETPLACE_WASM) \
		--output-dir ./src/bindings/data-marketplace \
		--overwrite
	@stellar contract bindings typescript \
		--wasm $(PUBLIC_CONTRACTS_DIR)/$(HEALTH_ALERTS_WASM) \
		--output-dir ./src/bindings/health-alerts \
		--overwrite
	@echo "TypeScript bindings generated in src/bindings/"

# Download token contract for deployment
get-token-contract:
	@echo "Downloading Soroban token contract..."
	@curl -sL https://github.com/stellar/soroban-examples/raw/main/token/target/wasm32-unknown-unknown/release/soroban_token_contract.wasm -o soroban_token_contract.wasm
	@echo "Token contract downloaded successfully."

# Format Rust code
fmt:
	@cd contracts && cargo fmt --all 