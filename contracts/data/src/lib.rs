#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map, Symbol, Vec, String, Bytes, symbol_short, contracterror};
use soroban_sdk::prng::Prng;
use core::cmp;

#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum DataError {
    AlreadyInitialized = 1,
    NotInitialized = 2, // If owner/registry isn't set before an operation
    DataNotFound = 3,
    Unauthorized = 4, // Though usually handled by require_auth
    StorageError = 5, // Generic storage issue
    UserNotAuthorized = 6,
    UserNotFound = 7,
}

/// Data storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    RegistryContract,
    UserData(Address, BytesN<32>),  // user, data_id
    DataIndex(Address),             // user -> list of data_ids
    Permission(Address, Address)    // grantor, grantee -> AccessLevel
}

/// Permission levels for data access
#[derive(Clone, PartialEq, Copy)]
#[contracttype]
pub enum AccessLevel {
    None = 0,
    ReadOnly = 1,
    ReadWrite = 2,
    Full = 3,
}

/// Encrypted data structure with metadata
#[derive(Clone)]
#[contracttype]
pub struct EncryptedData {
    pub encrypted_content: Bytes, // Encrypted data, format depends on client
    pub metadata: Bytes, // Metadata about the data (unencrypted or encrypted)
    pub timestamp: u64, // When the data was last updated
    pub data_type: u32, // Type of data (period, symptom, etc.)
}

#[contract]
pub struct DataContract;

#[contractimpl]
impl DataContract {
    /// Initialize the contract with registry address
    pub fn initialize(env: Env, owner: Address, registry_contract: Address) -> Result<(), DataError> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(DataError::AlreadyInitialized);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::RegistryContract, &registry_contract);
        env.events().publish(
            (symbol_short!("init"), symbol_short!("data")),
            owner
        );
        Ok(())
    }
    
    /// Generate a random data ID to avoid collisions
    fn generate_data_id(env: &Env) -> BytesN<32> {
        // Create a random seed based on the timestamp
        let timestamp = env.ledger().timestamp();
        let random_bytes = timestamp.to_be_bytes();
        
        // Create a BytesN object from the random bytes for hashing
        let bytes_to_hash = Bytes::from_array(env, &random_bytes);
        
        // Hash the bytes to get a deterministic but random-like BytesN<32>
        env.crypto().sha256(&bytes_to_hash)
    }
    
    /// Store encrypted data
    pub fn store_data(
        env: Env, 
        user: Address,
        encrypted_content: Bytes,
        metadata: Bytes,
        data_type: u32
    ) -> Result<BytesN<32>, DataError> {
        user.require_auth();
        
        // Create data ID using a timestamp-based approach
        let data_id = Self::generate_data_id(&env);
        
        // Record timestamp
        let timestamp = env.ledger().timestamp();
        
        // Create data object
        let data = EncryptedData {
            encrypted_content,
            metadata,
            timestamp,
            data_type,
        };
        
        // Store the data
        env.storage().instance().set(&DataKey::UserData(user.clone(), data_id.clone()), &data);
        
        // Get the user's data index
        let data_index = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::DataIndex(user.clone()));
        let mut data_index = match data_index {
            Some(index) => index,
            None => Vec::new(&env),
        };
        
        data_index.push_back(data_id.clone());
        env.storage().instance().set(&DataKey::DataIndex(user.clone()), &data_index);
        
        // Log data storage
        env.events().publish(
            (symbol_short!("store"), symbol_short!("data")),
            (user, data_id.clone(), data_type)
        );
        
        Ok(data_id)
    }
    
    /// Update existing data
    pub fn update_data(
        env: Env,
        user: Address,
        data_id: BytesN<32>,
        encrypted_content: Bytes,
        metadata: Bytes,
        data_type: u32
    ) -> Result<(), DataError> {
        user.require_auth();
        if !env.storage().instance().has(&DataKey::UserData(user.clone(), data_id.clone())) {
            return Err(DataError::DataNotFound);
        }
        env.storage().instance().set(&DataKey::UserData(user.clone(), data_id.clone()), &EncryptedData {
            encrypted_content,
            metadata,
            timestamp: env.ledger().timestamp(),
            data_type,
        });
        env.events().publish(
            (symbol_short!("update"), symbol_short!("data")),
            (user, data_id, data_type)
        );
        Ok(())
    }
    
    /// Delete user data
    pub fn delete_data(
        env: Env,
        user: Address,
        data_id: BytesN<32>
    ) -> Result<(), DataError> {
        user.require_auth();
        if !env.storage().instance().has(&DataKey::UserData(user.clone(), data_id.clone())) {
            return Err(DataError::DataNotFound);
        }
        env.storage().instance().remove(&DataKey::UserData(user.clone(), data_id.clone()));
        
        // Get the data index
        let data_index = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::DataIndex(user.clone()));
        let mut data_index = match data_index {
            Some(index) => index,
            None => return Ok(()),
        };
        
        // Remove the data ID from the index if found
        for i in 0..data_index.len() {
            if data_index.get_unchecked(i) == data_id {
                data_index.remove(i);
                break;
            }
        }
        
        env.storage().instance().set(&DataKey::DataIndex(user.clone()), &data_index);
        
        env.events().publish(
            (symbol_short!("delete"), symbol_short!("data")),
            (user, data_id)
        );
        Ok(())
    }
    
    /// Grant permission to another user
    pub fn grant_permission(
        env: Env,
        grantor: Address,
        grantee: Address,
        level: AccessLevel
    ) -> Result<(), DataError> {
        grantor.require_auth();
        env.storage().instance().set(&DataKey::Permission(grantor.clone(), grantee.clone()), &level);
        env.events().publish(
            (symbol_short!("grant"), symbol_short!("perm")),
            (grantor, grantee, level as u32)
        );
        Ok(())
    }
    
    /// Check permission level
    pub fn check_permission_internal(env: &Env, data_owner: Address, requester: Address) -> Result<AccessLevel, DataError> {
        if data_owner == requester {
            return Ok(AccessLevel::ReadWrite);
        }
        
        let permission = env.storage().instance().get::<DataKey, AccessLevel>(&DataKey::Permission(data_owner, requester));
        match permission {
            Some(level) => Ok(level),
            None => Ok(AccessLevel::None),
        }
    }
    
    /// Get encrypted data by ID (with permission check)
    pub fn get_data(
        env: Env,
        data_owner: Address,
        requester: Address,
        data_id: BytesN<32>
    ) -> Result<EncryptedData, DataError> {
        let permission = Self::check_permission_internal(&env, data_owner.clone(), requester.clone())?;
        if permission == AccessLevel::None {
            return Err(DataError::UserNotAuthorized);
        }
        
        let data = env.storage().instance().get::<DataKey, EncryptedData>(&DataKey::UserData(data_owner, data_id));
        match data {
            Some(data) => Ok(data),
            None => Err(DataError::DataNotFound),
        }
    }
    
    /// List all data IDs for a user
    pub fn list_data(env: Env, user: Address) -> Result<Vec<BytesN<32>>, DataError> {
        let data_ids = env.storage().instance().get::<DataKey, Vec<BytesN<32>>>(&DataKey::DataIndex(user));
        match data_ids {
            Some(ids) => Ok(ids),
            None => Ok(Vec::new(&env)),
        }
    }
    
    /// Get the owner of the contract
    pub fn get_owner(env: Env) -> Result<Address, DataError> {
        let owner = env.storage().instance().get::<DataKey, Address>(&DataKey::Owner);
        match owner {
            Some(addr) => Ok(addr),
            None => Err(DataError::NotInitialized),
        }
    }
}

/// Unit tests for the data contract
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, AuthorizedFunction, Events};
    use soroban_sdk::{vec, BytesN, Env, Symbol};

    fn create_test_encrypted_data(env: &Env, data_content: &[u8;32]) -> EncryptedData {
        let mut metadata = Map::new(env);
        metadata.set(symbol_short!("desc"), String::from_str(env, "Test data"));
        EncryptedData {
            encrypted_content: Bytes::from_array(env, data_content),
            metadata,
            timestamp: env.ledger().timestamp(),
            data_type: 0,
        }
    }

    #[test]
    fn test_initialize_data() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, DataContract);
        let client = DataContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        client.initialize(&owner, &registry).unwrap();
        assert_eq!(client.get_owner(), owner);
    }

    #[test]
    fn test_store_and_get_data() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, DataContract);
        let client = DataContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        client.initialize(&owner, &registry).unwrap();

        let user = Address::generate(&env);
        let test_data_content = [1u8; 32];
        let encrypted_data_struct = create_test_encrypted_data(&env, &test_data_content);

        let data_id = client.store_data(&user, &encrypted_data_struct.encrypted_content, &encrypted_data_struct.metadata, encrypted_data_struct.data_type).unwrap();
        
        let retrieved_data = client.get_data(&user, &user, &data_id).unwrap();
        assert_eq!(retrieved_data.encrypted_content, encrypted_data_struct.encrypted_content);
        assert_eq!(retrieved_data.metadata, encrypted_data_struct.metadata);
        assert_eq!(retrieved_data.data_type, encrypted_data_struct.data_type);

        let data_list = client.list_data(&user);
        assert_eq!(data_list.len(), 1);
        assert_eq!(data_list.get(0).unwrap().unwrap(), data_id);
    }

    #[test]
    fn test_permissions_data() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, DataContract);
        let client = DataContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        client.initialize(&owner, &registry).unwrap();

        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        let test_data_content = [2u8; 32];
        let encrypted_data_struct = create_test_encrypted_data(&env, &test_data_content);

        let data_id = client.store_data(&user1, &encrypted_data_struct.encrypted_content, &encrypted_data_struct.metadata, encrypted_data_struct.data_type).unwrap();

        // user2 should not have access initially
        assert_eq!(client.check_permission_internal(&user1, &user2).unwrap(), AccessLevel::None);
        let get_res = client.get_data(&user1, &user2, &data_id);
        assert!(get_res.is_err());

        // Grant read access
        client.grant_permission(&user1, &user2, &AccessLevel::ReadOnly).unwrap();
        assert_eq!(client.check_permission_internal(&user1, &user2).unwrap(), AccessLevel::ReadOnly);
        
        let retrieved_data = client.get_data(&user1, &user2, &data_id).unwrap();
        assert_eq!(retrieved_data.encrypted_content, encrypted_data_struct.encrypted_content);
        assert_eq!(retrieved_data.metadata, encrypted_data_struct.metadata);
        assert_eq!(retrieved_data.data_type, encrypted_data_struct.data_type);

        // User1 (owner) should have ReadWrite
        assert_eq!(client.check_permission_internal(&user1, &user1).unwrap(), AccessLevel::ReadWrite);
    }

    #[test]
    fn test_delete_data() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, DataContract);
        let client = DataContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        client.initialize(&owner, &Address::generate(&env)).unwrap();
        let user = Address::generate(&env);
        let encrypted_data_struct = create_test_encrypted_data(&env, &[3u8; 32]);
        let data_id = client.store_data(&user, &encrypted_data_struct.encrypted_content, &encrypted_data_struct.metadata, encrypted_data_struct.data_type).unwrap();

        assert_eq!(client.list_data(&user).len(), 1);
        client.delete_data(&user, &data_id).unwrap();
        assert_eq!(client.list_data(&user).len(), 0);
        let get_res = client.get_data(&user, &user, &data_id);
        assert!(get_res.is_err());
    }
} 