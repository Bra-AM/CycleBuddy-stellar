#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Symbol, Vec, BytesN};

#[derive(Clone)]
#[contracttype]
pub enum AccessLevel {
    ReadOnly,
    ReadWrite,
    FullAccess,
}

#[derive(Clone)]
#[contracttype]
pub struct DataShareConfig {
    owner: Address,
    recipient: Address,
    data_ids: Vec<BytesN<32>>, // Using hash identifiers for data
    start_time: u64,
    end_time: u64,
    access_level: AccessLevel,
}

#[derive(Clone)]
#[contracttype]
pub struct ShareAccess {
    config: DataShareConfig,
    share_id: BytesN<32>,
    is_active: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct AccessRequest {
    share_id: BytesN<32>,
    requester: Address,
    timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct AccessLog {
    share_id: BytesN<32>,
    requester: Address,
    timestamp: u64,
    data_ids: Vec<BytesN<32>>,
    success: bool,
}

#[contract]
pub struct DataSharingContract {
    admin: Address,
    shares: Map<BytesN<32>, ShareAccess>, // share_id -> ShareAccess
    user_shares_outgoing: Map<Address, Vec<BytesN<32>>>, // owner -> list of share_ids
    user_shares_incoming: Map<Address, Vec<BytesN<32>>>, // recipient -> list of share_ids
    access_logs: Vec<AccessLog>,
}

#[contractimpl]
impl DataSharingContract {
    // Initialize the contract
    pub fn initialize(env: Env, admin: Address) -> Self {
        admin.require_auth();
        
        Self {
            admin,
            shares: Map::new(&env),
            user_shares_outgoing: Map::new(&env),
            user_shares_incoming: Map::new(&env),
            access_logs: Vec::new(&env),
        }
    }
    
    // Create a time-bound share with multi-signature requirement
    pub fn create_time_bound_share(
        env: Env,
        owner: Address,
        recipient: Address,
        data_ids: Vec<BytesN<32>>,
        start_time: u64,
        end_time: u64,
        access_level: AccessLevel,
    ) -> BytesN<32> {
        owner.require_auth();
        
        // Validate time bounds
        let current_time = env.ledger().timestamp();
        if start_time < current_time {
            panic!("Start time must be in the future");
        }
        
        if end_time <= start_time {
            panic!("End time must be after start time");
        }
        
        // Create the data share configuration
        let config = DataShareConfig {
            owner: owner.clone(),
            recipient: recipient.clone(),
            data_ids,
            start_time,
            end_time,
            access_level,
        };
        
        // Create a unique share ID (hash of config data + timestamp)
        let share_id_preimage = env.crypto().sha256(
            &String::from_str(&env, &format!("{:?}_{:?}_{}", owner, recipient, env.ledger().timestamp()))
        );
        
        // Create the share access object
        let share_access = ShareAccess {
            config: config.clone(),
            share_id: share_id_preimage.clone(),
            is_active: true,
        };
        
        let contract = Self::load_contract(&env);
        let mut contract = contract;
        
        // Store the share
        contract.shares.set(share_id_preimage.clone(), share_access);
        
        // Update owner's outgoing shares
        let mut owner_shares = contract.user_shares_outgoing.get(owner.clone()).unwrap_or(Vec::new(&env));
        owner_shares.push_back(share_id_preimage.clone());
        contract.user_shares_outgoing.set(owner, owner_shares);
        
        // Update recipient's incoming shares
        let mut recipient_shares = contract.user_shares_incoming.get(recipient.clone()).unwrap_or(Vec::new(&env));
        recipient_shares.push_back(share_id_preimage.clone());
        contract.user_shares_incoming.set(recipient, recipient_shares);
        
        // In production, this would also create a real Stellar multi-signature 
        // transaction with time bounds that authorizes the data access
        Self::save_contract(&env, &contract);
        
        share_id_preimage
    }
    
    // Access shared data (requires authentication from recipient)
    pub fn access_shared_data(
        env: Env,
        share_id: BytesN<32>,
        requester: Address,
    ) -> Result<Vec<BytesN<32>>, String> {
        requester.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Get the share
        let share = contract.shares.get(share_id.clone())
            .ok_or(String::from_str(&env, "Share not found"))?;
        
        // Verify the share is active
        if !share.is_active {
            return Err(String::from_str(&env, "Share is no longer active"));
        }
        
        // Verify the requester is the intended recipient
        if share.config.recipient != requester {
            return Err(String::from_str(&env, "Unauthorized requester"));
        }
        
        // Verify time bounds
        let current_time = env.ledger().timestamp();
        
        if current_time < share.config.start_time {
            return Err(String::from_str(&env, "Share is not yet active"));
        }
        
        if current_time > share.config.end_time {
            // Deactivate expired shares
            let mut updated_share = share.clone();
            updated_share.is_active = false;
            
            let mut contract = contract;
            contract.shares.set(share_id.clone(), updated_share);
            Self::save_contract(&env, &contract);
            
            return Err(String::from_str(&env, "Share has expired"));
        }
        
        // Log the access
        let log = AccessLog {
            share_id: share_id.clone(),
            requester: requester.clone(),
            timestamp: current_time,
            data_ids: share.config.data_ids.clone(),
            success: true,
        };
        
        let mut contract = contract;
        contract.access_logs.push_back(log);
        Self::save_contract(&env, &contract);
        
        // Return the data IDs that can be accessed
        // In a real implementation, this would also verify the multi-signature transaction
        Ok(share.config.data_ids)
    }
    
    // Revoke a share (only owner can revoke)
    pub fn revoke_share(
        env: Env,
        owner: Address,
        share_id: BytesN<32>,
    ) -> Result<(), String> {
        owner.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Get the share
        let share = contract.shares.get(share_id.clone())
            .ok_or(String::from_str(&env, "Share not found"))?;
        
        // Verify the caller is the owner
        if share.config.owner != owner {
            return Err(String::from_str(&env, "Only the owner can revoke shares"));
        }
        
        // Deactivate the share
        let mut updated_share = share;
        updated_share.is_active = false;
        
        let mut contract = contract;
        contract.shares.set(share_id, updated_share);
        Self::save_contract(&env, &contract);
        
        // In production, this would also cancel the multi-signature transaction
        
        Ok(())
    }
    
    // Get shares created by a user
    pub fn get_outgoing_shares(
        env: Env,
        owner: Address,
    ) -> Vec<ShareAccess> {
        let contract = Self::load_contract(&env);
        let mut result = Vec::new(&env);
        
        if let Some(share_ids) = contract.user_shares_outgoing.get(owner) {
            for share_id in share_ids.iter() {
                if let Some(share) = contract.shares.get(share_id) {
                    result.push_back(share);
                }
            }
        }
        
        result
    }
    
    // Get shares available to a user
    pub fn get_incoming_shares(
        env: Env,
        recipient: Address,
    ) -> Vec<ShareAccess> {
        let contract = Self::load_contract(&env);
        let mut result = Vec::new(&env);
        
        if let Some(share_ids) = contract.user_shares_incoming.get(recipient) {
            for share_id in share_ids.iter() {
                if let Some(share) = contract.shares.get(share_id) {
                    // Only return active shares
                    if share.is_active {
                        result.push_back(share);
                    }
                }
            }
        }
        
        result
    }
    
    // Get share details
    pub fn get_share(
        env: Env,
        share_id: BytesN<32>,
    ) -> Option<ShareAccess> {
        let contract = Self::load_contract(&env);
        contract.shares.get(share_id)
    }
    
    // Get access logs for a share (admin or owner can view)
    pub fn get_access_logs(
        env: Env,
        caller: Address,
        share_id: BytesN<32>,
    ) -> Result<Vec<AccessLog>, String> {
        caller.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Get the share
        let share = contract.shares.get(share_id.clone())
            .ok_or(String::from_str(&env, "Share not found"))?;
        
        // Verify caller is admin or owner
        if caller != contract.admin && caller != share.config.owner {
            return Err(String::from_str(&env, "Unauthorized"));
        }
        
        // Filter logs for this share
        let mut result = Vec::new(&env);
        
        for log in contract.access_logs.iter() {
            if log.share_id == share_id {
                result.push_back(log);
            }
        }
        
        Ok(result)
    }
    
    // Helper function to load contract state
    fn load_contract(env: &Env) -> DataSharingContract {
        // In a full implementation, we'd load from storage
        // For prototype, return empty contract
        DataSharingContract {
            admin: Address::from_string(env, "GBUKOFF6FX6767LKKOD3P7KAS43I3Z7CNUBPCH33YZKPPR53ZDHAHCER"),
            shares: Map::new(env),
            user_shares_outgoing: Map::new(env),
            user_shares_incoming: Map::new(env),
            access_logs: Vec::new(env),
        }
    }
    
    // Helper function to save contract state
    fn save_contract(env: &Env, contract: &DataSharingContract) {
        // In a full implementation, we'd save to storage
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, BytesN};
    
    #[test]
    fn test_data_sharing_flow() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let owner = Address::generate(&env);
        let recipient = Address::generate(&env);
        
        // Initialize contract
        let contract = DataSharingContract::initialize(env.clone(), admin);
        
        // Create some data IDs
        let data_id1 = BytesN::from_array(&env, &[1u8; 32]);
        let data_id2 = BytesN::from_array(&env, &[2u8; 32]);
        
        let mut data_ids = Vec::new(&env);
        data_ids.push_back(data_id1);
        data_ids.push_back(data_id2);
        
        // Set up time bounds (current time + 10, current time + 100)
        let current_time = env.ledger().timestamp();
        let start_time = current_time + 10;
        let end_time = current_time + 100;
        
        // Create a share
        let share_id = DataSharingContract::create_time_bound_share(
            env.clone(),
            owner.clone(),
            recipient.clone(),
            data_ids,
            start_time,
            end_time,
            AccessLevel::ReadOnly,
        );
        
        // Check owner's outgoing shares
        let owner_shares = DataSharingContract::get_outgoing_shares(env.clone(), owner.clone());
        assert_eq!(owner_shares.len(), 1);
        
        // Check recipient's incoming shares
        let recipient_shares = DataSharingContract::get_incoming_shares(env.clone(), recipient.clone());
        assert_eq!(recipient_shares.len(), 1);
        
        // Try to access before start time (should fail)
        let result = DataSharingContract::access_shared_data(
            env.clone(),
            share_id.clone(),
            recipient.clone(),
        );
        assert!(result.is_err());
        
        // Advance time to after start_time
        env.ledger().set(soroban_sdk::ledger::LedgerInfo {
            timestamp: start_time + 5,
            protocol_version: 20,
            sequence_number: 100,
            network_id: BytesN::from_array(&env, &[0; 32]),
            base_reserve: 10,
            min_persistent_entry_ttl: 100,
            min_temp_entry_ttl: 100,
            max_persistent_entry_ttl: 200,
            max_temp_entry_ttl: 200,
            max_persistent_entry_size: 100,
            max_temp_entry_size: 100,
        });
        
        // Now access should work
        let result = DataSharingContract::access_shared_data(
            env.clone(),
            share_id.clone(),
            recipient.clone(),
        );
        assert!(result.is_ok());
        
        // Check access logs
        let logs = DataSharingContract::get_access_logs(env.clone(), owner.clone(), share_id.clone()).unwrap();
        assert_eq!(logs.len(), 1);
        
        // Revoke the share
        DataSharingContract::revoke_share(env.clone(), owner, share_id.clone()).unwrap();
        
        // Try to access after revocation (should fail)
        let result = DataSharingContract::access_shared_data(
            env.clone(),
            share_id,
            recipient,
        );
        assert!(result.is_err());
    }
} 