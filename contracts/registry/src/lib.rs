#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, String, Val, Vec, symbol_short, IntoVal, contracterror};

#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3, // Kept for consistency if needed, though owner checks are specific
    ContractNotSet = 4,
    UserAlreadyRegistered = 5,
    StorageError = 7, // For SDK storage errors
}

// Define contract types
#[derive(Clone)]
#[contracttype]
pub enum ContractType {
    Auth = 0,
    Data = 1,
    Community = 2,
}

// Define storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    UserRegistry,
    DataContract,
    AuthContract,
    CommunityContract,
    User(Address),
}

// Define registry contract with storage of other contract addresses
#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    // Initialize the registry contract
    pub fn initialize(env: Env, owner: Address) -> Result<(), RegistryError> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(RegistryError::AlreadyInitialized);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::UserRegistry, &Vec::<Address>::new(&env));
        env.events().publish(
            (symbol_short!("init"), symbol_short!("reg")),
            owner
        );
        Ok(())
    }

    pub fn set_data_contract(env: Env, data_contract: Address) -> Result<(), RegistryError> {
        let owner = Self::get_owner_internal(&env)?;
        owner.require_auth();
        env.storage().instance().set(&DataKey::DataContract, &data_contract);
        env.events().publish(
            (symbol_short!("set_data"), symbol_short!("contract")),
            data_contract.clone()
        );
        Ok(())
    }
    
    pub fn set_auth_contract(env: Env, auth_contract: Address) -> Result<(), RegistryError> {
        let owner = Self::get_owner_internal(&env)?;
        owner.require_auth();
        env.storage().instance().set(&DataKey::AuthContract, &auth_contract);
        env.events().publish(
            (symbol_short!("set_auth"), symbol_short!("contract")),
            auth_contract.clone()
        );
        Ok(())
    }
    
    pub fn set_community_contract(env: Env, community_contract: Address) -> Result<(), RegistryError> {
        let owner = Self::get_owner_internal(&env)?;
        owner.require_auth();
        env.storage().instance().set(&DataKey::CommunityContract, &community_contract);
        env.events().publish(
            (symbol_short!("set_comm"), symbol_short!("contract")),
            community_contract.clone()
        );
        Ok(())
    }
    
    pub fn register_user(env: Env, user: Address) -> Result<(), RegistryError> {
        user.require_auth();
        if env.storage().instance().has(&DataKey::User(user.clone())) {
            return Err(RegistryError::UserAlreadyRegistered);
        }
        env.storage().instance().set(&DataKey::User(user.clone()), &true);
        
        // Get existing registry or create new one
        let mut registry = if let Some(registry_val) = env.storage().instance().get::<DataKey, Vec<Address>>(&DataKey::UserRegistry) {
            registry_val
        } else {
            Vec::new(&env)
        };
        
        registry.push_back(user.clone());
        env.storage().instance().set(&DataKey::UserRegistry, &registry);
        
        env.events().publish(
            (symbol_short!("register"), symbol_short!("user")),
            user
        );
        Ok(())
    }
    
    pub fn is_registered(env: Env, user: Address) -> bool {
        env.storage().instance().has(&DataKey::User(user))
    }
    
    pub fn get_data_contract(env: Env) -> Result<Address, RegistryError> {
        let data_contract = env.storage().instance().get::<DataKey, Address>(&DataKey::DataContract);
        if let Some(addr) = data_contract {
            Ok(addr)
        } else {
            Err(RegistryError::ContractNotSet)
        }
    }
    
    pub fn get_auth_contract(env: Env) -> Result<Address, RegistryError> {
        let auth_contract = env.storage().instance().get::<DataKey, Address>(&DataKey::AuthContract);
        if let Some(addr) = auth_contract {
            Ok(addr)
        } else {
            Err(RegistryError::ContractNotSet)
        }
    }
    
    pub fn get_community_contract(env: Env) -> Result<Address, RegistryError> {
        let community_contract = env.storage().instance().get::<DataKey, Address>(&DataKey::CommunityContract);
        if let Some(addr) = community_contract {
            Ok(addr)
        } else {
            Err(RegistryError::ContractNotSet)
        }
    }
    
    pub fn get_users(env: Env) -> Result<Vec<Address>, RegistryError> {
        let users = env.storage().instance().get::<DataKey, Vec<Address>>(&DataKey::UserRegistry);
        if let Some(vec) = users {
            Ok(vec)
        } else {
            Ok(Vec::new(&env))
        }
    }

    // Internal helper to get owner, not exposed via contract interface
    fn get_owner_internal(env: &Env) -> Result<Address, RegistryError> {
        let owner = env.storage().instance().get::<DataKey, Address>(&DataKey::Owner);
        if let Some(addr) = owner {
            Ok(addr)
        } else {
            Err(RegistryError::NotInitialized)
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Events};
    use soroban_sdk::{vec, Symbol, IntoVal};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, RegistryContract);
        let client = RegistryContractClient::new(&env, &contract_id);
        
        let owner = Address::generate(&env);
        
        assert_eq!(client.try_initialize(&owner), Ok(Ok(())));
        
        let stored_owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        assert_eq!(stored_owner, owner);

        let events = env.events().all();
        assert_eq!(events.len(), 1, "Expected 1 event");
        
        let expected_topics = (symbol_short!("init"), symbol_short!("reg")).into_val(&env);
        let expected_data = owner.clone().into_val(&env); // Clone owner for into_val

        let (event_contract_id, event_topics, event_data) = events.last().unwrap();
        
        assert_eq!(event_contract_id, &contract_id);
        assert_eq!(event_topics, &expected_topics);
        assert_eq!(event_data, &expected_data);
    }
    
    #[test]
    fn test_set_and_get_contracts() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, RegistryContract);
        let client = RegistryContractClient::new(&env, &contract_id);
        
        let owner = Address::generate(&env);
        client.initialize(&owner);
        
        let data_addr = Address::generate(&env);
        let auth_addr = Address::generate(&env);
        let comm_addr = Address::generate(&env);

        client.set_data_contract(&data_addr);
        client.set_auth_contract(&auth_addr);
        client.set_community_contract(&comm_addr);

        assert_eq!(client.get_data_contract(), data_addr);
        assert_eq!(client.get_auth_contract(), auth_addr);
        assert_eq!(client.get_community_contract(), comm_addr);
        
        let events = env.events().all();
        assert_eq!(events.len(), 4); 
    }

    #[test]
    fn test_register_and_check_user() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, RegistryContract);
        let client = RegistryContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        client.initialize(&owner);

        let user1 = Address::generate(&env);
        
        assert!(!client.is_registered(&user1));
        client.register_user(&user1);
        assert!(client.is_registered(&user1));

        let users_vec = client.get_users();
        assert_eq!(users_vec.len(), 1);
        assert_eq!(users_vec.get_unchecked(0), user1);

        let res = client.try_register_user(&user1);
        assert_eq!(res, Err(Ok(RegistryError::UserAlreadyRegistered)));
    }
} 