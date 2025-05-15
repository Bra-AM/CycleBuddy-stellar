#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec, BytesN};

#[derive(Clone)]
#[contracttype]
pub enum PoolType {
    MenstrualCycleData,
    SymptomData,
    FertilityData,
    WellnessData,
    MedicalResearch,
    MarketTrends,
}

#[derive(Clone)]
#[contracttype]
pub struct DataPool {
    id: BytesN<32>,
    name: String,
    description: String,
    pool_type: PoolType,
    creator: Address,
    total_contributors: u32,
    total_revenue: i128,
    is_active: bool,
    created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct DataContribution {
    user: Address,
    pool_id: BytesN<32>,
    data_hash: String, // Hash of the data, actual data stored elsewhere
    timestamp: u64,
    shares: u32, // Number of shares/weight in the pool
}

#[derive(Clone)]
#[contracttype]
pub struct DataPurchase {
    buyer: Address,
    pool_id: BytesN<32>,
    amount: i128,
    timestamp: u64,
    access_expiry: u64, // When access expires
}

#[derive(Clone)]
#[contracttype]
pub struct RevenueShare {
    user: Address,
    pool_id: BytesN<32>,
    amount: i128,
    timestamp: u64,
    claimed: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct DataAccess {
    id: BytesN<32>,
    buyer: Address,
    pool_id: BytesN<32>,
    granted_at: u64,
    expires_at: u64,
    api_key: String, // In a real system, this would be securely managed
}

#[contract]
pub struct DataMarketplaceContract {
    admin: Address,
    pools: Map<BytesN<32>, DataPool>,
    user_contributions: Map<Address, Vec<DataContribution>>,
    pool_contributions: Map<BytesN<32>, Vec<DataContribution>>,
    data_purchases: Vec<DataPurchase>,
    user_revenue_shares: Map<Address, Vec<RevenueShare>>,
    data_accesses: Map<Address, Vec<DataAccess>>,
    marketplace_fee: u32, // Basis points (e.g., 250 = 2.5%)
}

#[contractimpl]
impl DataMarketplaceContract {
    // Initialize the contract
    pub fn initialize(env: Env, admin: Address, marketplace_fee: u32) -> Self {
        admin.require_auth();
        
        // Ensure fee is reasonable (max 10%)
        if marketplace_fee > 1000 {
            panic!("Marketplace fee too high");
        }
        
        Self {
            admin,
            pools: Map::new(&env),
            user_contributions: Map::new(&env),
            pool_contributions: Map::new(&env),
            data_purchases: Vec::new(&env),
            user_revenue_shares: Map::new(&env),
            data_accesses: Map::new(&env),
            marketplace_fee,
        }
    }
    
    // Create a new data pool
    pub fn create_data_pool(
        env: Env,
        creator: Address,
        name: String,
        description: String,
        pool_type: PoolType,
    ) -> BytesN<32> {
        creator.require_auth();
        
        // Create a unique pool ID
        let pool_id = env.crypto().sha256(
            &String::from_str(&env, &format!("{:?}_{:?}_{}", 
                name, creator, env.ledger().timestamp()))
        );
        
        // Create the pool
        let pool = DataPool {
            id: pool_id.clone(),
            name,
            description,
            pool_type,
            creator,
            total_contributors: 0,
            total_revenue: 0,
            is_active: true,
            created_at: env.ledger().timestamp(),
        };
        
        let contract = Self::load_contract(&env);
        let mut contract = contract;
        
        // Store the pool
        contract.pools.set(pool_id.clone(), pool);
        Self::save_contract(&env, &contract);
        
        pool_id
    }
    
    // Contribute data to a pool
    pub fn contribute_data(
        env: Env,
        user: Address,
        pool_id: BytesN<32>,
        data_hash: String,
    ) -> Result<(), String> {
        user.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Check if pool exists
        let mut pool = contract.pools.get(pool_id.clone())
            .ok_or(String::from_str(&env, "Pool not found"))?;
        
        // Check if pool is active
        if !pool.is_active {
            return Err(String::from_str(&env, "Pool is not active"));
        }
        
        // Create the contribution
        let contribution = DataContribution {
            user: user.clone(),
            pool_id: pool_id.clone(),
            data_hash,
            timestamp: env.ledger().timestamp(),
            shares: 1, // Simple model: each contribution is worth 1 share
        };
        
        let mut contract = contract;
        
        // Update user's contributions
        let mut user_contribs = contract.user_contributions.get(user.clone()).unwrap_or(Vec::new(&env));
        user_contribs.push_back(contribution.clone());
        contract.user_contributions.set(user, user_contribs);
        
        // Update pool's contributions
        let mut pool_contribs = contract.pool_contributions.get(pool_id.clone()).unwrap_or(Vec::new(&env));
        pool_contribs.push_back(contribution);
        contract.pool_contributions.set(pool_id.clone(), pool_contribs);
        
        // Update pool stats
        pool.total_contributors += 1;
        contract.pools.set(pool_id, pool);
        
        Self::save_contract(&env, &contract);
        
        Ok(())
    }
    
    // Purchase access to a data pool
    pub fn purchase_data_access(
        env: Env,
        buyer: Address,
        pool_id: BytesN<32>,
        amount: i128,
        access_duration: u64,
    ) -> Result<DataAccess, String> {
        buyer.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Check if pool exists and is active
        let mut pool = contract.pools.get(pool_id.clone())
            .ok_or(String::from_str(&env, "Pool not found"))?;
        
        if !pool.is_active {
            return Err(String::from_str(&env, "Pool is not active"));
        }
        
        // In a real implementation, this would handle the payment
        // For the prototype, we'll just record the purchase
        
        // Record the purchase
        let purchase = DataPurchase {
            buyer: buyer.clone(),
            pool_id: pool_id.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
            access_expiry: env.ledger().timestamp() + access_duration,
        };
        
        let mut contract = contract;
        contract.data_purchases.push_back(purchase);
        
        // Calculate revenue shares
        Self::distribute_revenue_shares(&env, &pool_id, amount);
        
        // Update pool total revenue
        pool.total_revenue += amount;
        contract.pools.set(pool_id.clone(), pool);
        
        // Create data access
        let access_id = env.crypto().sha256(
            &String::from_str(&env, &format!("{:?}_{:?}_{}", 
                buyer, pool_id, env.ledger().timestamp()))
        );
        
        let access = DataAccess {
            id: access_id,
            buyer: buyer.clone(),
            pool_id: pool_id.clone(),
            granted_at: env.ledger().timestamp(),
            expires_at: env.ledger().timestamp() + access_duration,
            api_key: Self::generate_api_key(&env, &buyer, &pool_id),
        };
        
        // Store buyer's access
        let mut user_accesses = contract.data_accesses.get(buyer.clone()).unwrap_or(Vec::new(&env));
        user_accesses.push_back(access.clone());
        contract.data_accesses.set(buyer, user_accesses);
        
        Self::save_contract(&env, &contract);
        
        Ok(access)
    }
    
    // Distribute revenue shares to contributors
    fn distribute_revenue_shares(
        env: &Env,
        pool_id: &BytesN<32>,
        amount: i128,
    ) {
        let contract = Self::load_contract(env);
        
        // Get pool contributions
        if let Some(contributions) = contract.pool_contributions.get(pool_id.clone()) {
            // Calculate total shares
            let mut total_shares: u32 = 0;
            for contribution in contributions.iter() {
                total_shares += contribution.shares;
            }
            
            if total_shares == 0 {
                return; // No contributors yet
            }
            
            // Calculate marketplace fee
            let fee_amount = (amount * (contract.marketplace_fee as i128)) / 10000;
            let distribute_amount = amount - fee_amount;
            
            // Create a map to aggregate shares by user
            let mut user_shares: Map<Address, u32> = Map::new(env);
            
            for contribution in contributions.iter() {
                let current_shares = user_shares.get(contribution.user.clone()).unwrap_or(0);
                user_shares.set(contribution.user.clone(), current_shares + contribution.shares);
            }
            
            let mut contract = contract;
            
            // Distribute revenue based on shares
            for (user, shares) in user_shares.iter() {
                let user_amount = (distribute_amount * (shares as i128)) / (total_shares as i128);
                
                if user_amount > 0 {
                    // Create revenue share
                    let share = RevenueShare {
                        user: user.clone(),
                        pool_id: pool_id.clone(),
                        amount: user_amount,
                        timestamp: env.ledger().timestamp(),
                        claimed: false,
                    };
                    
                    // Add to user's revenue shares
                    let mut user_shares = contract.user_revenue_shares.get(user.clone()).unwrap_or(Vec::new(env));
                    user_shares.push_back(share);
                    contract.user_revenue_shares.set(user, user_shares);
                }
            }
            
            Self::save_contract(env, &contract);
        }
    }
    
    // Generate API key for data access
    fn generate_api_key(
        env: &Env,
        user: &Address,
        pool_id: &BytesN<32>,
    ) -> String {
        // In a real implementation, this would be a secure API key generation
        // For the prototype, we'll create a simple hash-based key
        let key_data = env.crypto().sha256(
            &String::from_str(env, &format!("{:?}_{:?}_{}", 
                user, pool_id, env.ledger().timestamp()))
        );
        
        // Convert first 8 bytes to a hex string
        let mut key_str = String::from_str(env, "cb_");
        // This is a simplified version that just uses the first byte's numeric value
        // In a real implementation, we'd convert each byte to its hex representation
        let byte_val = key_data.to_array()[0] as u64; // Get the first byte as a u64
        key_str = String::from_str(env, &format!("cb_data_key_{}", byte_val));
        
        key_str
    }
    
    // Claim revenue shares
    pub fn claim_revenue(
        env: Env,
        user: Address,
    ) -> Result<i128, String> {
        user.require_auth();
        
        let contract = Self::load_contract(&env);
        let mut total_claimed: i128 = 0;
        
        // Get user's revenue shares
        if let Some(shares) = contract.user_revenue_shares.get(user.clone()) {
            let mut updated_shares = Vec::new(&env);
            
            for share in shares.iter() {
                if !share.claimed {
                    // In a real implementation, this would handle the payment
                    // For the prototype, we'll just mark it as claimed
                    
                    total_claimed += share.amount;
                    
                    // Update the share
                    let mut updated_share = share.clone();
                    updated_share.claimed = true;
                    updated_shares.push_back(updated_share);
                } else {
                    updated_shares.push_back(share);
                }
            }
            
            // Update user's shares
            let mut contract = contract;
            contract.user_revenue_shares.set(user, updated_shares);
            Self::save_contract(&env, &contract);
        }
        
        if total_claimed == 0 {
            return Err(String::from_str(&env, "No revenue to claim"));
        }
        
        Ok(total_claimed)
    }
    
    // Get all data pools
    pub fn list_data_pools(
        env: Env,
    ) -> Vec<DataPool> {
        let contract = Self::load_contract(&env);
        let mut result = Vec::new(&env);
        
        for (_, pool) in contract.pools.iter() {
            if pool.is_active {
                result.push_back(pool);
            }
        }
        
        result
    }
    
    // Get pool details
    pub fn get_pool(
        env: Env,
        pool_id: BytesN<32>,
    ) -> Option<DataPool> {
        let contract = Self::load_contract(&env);
        contract.pools.get(pool_id)
    }
    
    // Get user's contributions
    pub fn get_user_contributions(
        env: Env,
        user: Address,
    ) -> Vec<DataContribution> {
        let contract = Self::load_contract(&env);
        contract.user_contributions.get(user).unwrap_or(Vec::new(&env))
    }
    
    // Get user's revenue shares
    pub fn get_user_revenue_shares(
        env: Env,
        user: Address,
    ) -> Vec<RevenueShare> {
        let contract = Self::load_contract(&env);
        contract.user_revenue_shares.get(user).unwrap_or(Vec::new(&env))
    }
    
    // Get user's data accesses
    pub fn get_user_data_accesses(
        env: Env,
        user: Address,
    ) -> Vec<DataAccess> {
        let contract = Self::load_contract(&env);
        let mut result = Vec::new(&env);
        
        if let Some(accesses) = contract.data_accesses.get(user) {
            // Only return active accesses
            let current_time = env.ledger().timestamp();
            
            for access in accesses.iter() {
                if access.expires_at > current_time {
                    result.push_back(access);
                }
            }
        }
        
        result
    }
    
    // Set marketplace fee (admin only)
    pub fn set_marketplace_fee(
        env: Env,
        admin: Address,
        fee: u32,
    ) -> Result<(), String> {
        admin.require_auth();
        
        let contract = Self::load_contract(&env);
        
        if admin != contract.admin {
            return Err(String::from_str(&env, "Only admin can set fees"));
        }
        
        // Ensure fee is reasonable (max 10%)
        if fee > 1000 {
            return Err(String::from_str(&env, "Fee too high (max 10%)"));
        }
        
        let mut contract = contract;
        contract.marketplace_fee = fee;
        Self::save_contract(&env, &contract);
        
        Ok(())
    }
    
    // Deactivate a pool (admin or creator only)
    pub fn deactivate_pool(
        env: Env,
        caller: Address,
        pool_id: BytesN<32>,
    ) -> Result<(), String> {
        caller.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Get the pool
        let mut pool = contract.pools.get(pool_id.clone())
            .ok_or(String::from_str(&env, "Pool not found"))?;
        
        // Check permissions
        if caller != contract.admin && caller != pool.creator {
            return Err(String::from_str(&env, "Only admin or creator can deactivate pool"));
        }
        
        // Deactivate the pool
        let mut contract = contract;
        pool.is_active = false;
        contract.pools.set(pool_id, pool);
        Self::save_contract(&env, &contract);
        
        Ok(())
    }
    
    // Helper function to load contract state
    fn load_contract(env: &Env) -> DataMarketplaceContract {
        // In a full implementation, we'd load from storage
        // For prototype, return empty contract
        DataMarketplaceContract {
            admin: Address::from_string(env, "GBUKOFF6FX6767LKKOD3P7KAS43I3Z7CNUBPCH33YZKPPR53ZDHAHCER"),
            pools: Map::new(env),
            user_contributions: Map::new(env),
            pool_contributions: Map::new(env),
            data_purchases: Vec::new(env),
            user_revenue_shares: Map::new(env),
            data_accesses: Map::new(env),
            marketplace_fee: 250, // Default 2.5%
        }
    }
    
    // Helper function to save contract state
    fn save_contract(env: &Env, contract: &DataMarketplaceContract) {
        // In a full implementation, we'd save to storage
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};
    
    #[test]
    fn test_data_marketplace_flow() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        let buyer = Address::generate(&env);
        
        // Initialize contract with 5% marketplace fee
        let contract = DataMarketplaceContract::initialize(env.clone(), admin, 500);
        
        // Create a data pool
        let pool_id = DataMarketplaceContract::create_data_pool(
            env.clone(),
            admin.clone(),
            String::from_str(&env, "Menstrual Health Research"),
            String::from_str(&env, "Anonymized menstrual cycle data for research"),
            PoolType::MenstrualCycleData,
        );
        
        // User1 contributes data
        DataMarketplaceContract::contribute_data(
            env.clone(),
            user1.clone(),
            pool_id.clone(),
            String::from_str(&env, "hash123"),
        ).unwrap();
        
        // User2 contributes data
        DataMarketplaceContract::contribute_data(
            env.clone(),
            user2.clone(),
            pool_id.clone(),
            String::from_str(&env, "hash456"),
        ).unwrap();
        
        // Check user contributions
        let user1_contribs = DataMarketplaceContract::get_user_contributions(env.clone(), user1.clone());
        assert_eq!(user1_contribs.len(), 1);
        
        // Buyer purchases access
        let amount = 1000;
        let access_duration = 86400 * 30; // 30 days
        
        let access = DataMarketplaceContract::purchase_data_access(
            env.clone(),
            buyer.clone(),
            pool_id.clone(),
            amount,
            access_duration,
        ).unwrap();
        
        // Check buyer's access
        let buyer_accesses = DataMarketplaceContract::get_user_data_accesses(env.clone(), buyer.clone());
        assert_eq!(buyer_accesses.len(), 1);
        
        // Check revenue shares were created
        let user1_shares = DataMarketplaceContract::get_user_revenue_shares(env.clone(), user1.clone());
        assert_eq!(user1_shares.len(), 1);
        
        let user2_shares = DataMarketplaceContract::get_user_revenue_shares(env.clone(), user2.clone());
        assert_eq!(user2_shares.len(), 1);
        
        // Calculate expected revenue distribution
        // 1000 * 0.95 = 950 total to distribute
        // Each user should get 475
        assert_eq!(user1_shares[0].amount, 475);
        assert_eq!(user2_shares[0].amount, 475);
        
        // Claim revenue
        let claimed = DataMarketplaceContract::claim_revenue(env.clone(), user1.clone()).unwrap();
        assert_eq!(claimed, 475);
        
        // Check that share is now claimed
        let updated_user1_shares = DataMarketplaceContract::get_user_revenue_shares(env.clone(), user1.clone());
        assert_eq!(updated_user1_shares[0].claimed, true);
    }
} 