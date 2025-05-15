#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Vec, Bytes, symbol_short, contracterror};
use soroban_sdk::prng::Prng;

#[contracterror]
#[derive(Clone, Debug, Copy, Eq, PartialEq)]
#[repr(u32)]
pub enum AuthError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidPasskey = 4,
    PasskeyNotFound = 5,
    RecoveryKeyNotFound = 6,
    NonceNotFound = 7,
    NonceUsed = 8,
    InvalidSignature = 9,
    InvalidRecoveryKey = 10,
    MaxRecoveryKeysReached = 11,
    StorageError = 12,
}

// Types of authentication challenges
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum ChallengeType {
    Login = 0,
    Transaction = 1,
    Recovery = 2,
}

// Storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    Passkey(Address), // User address -> passkey
    RecoveryKeyCount(Address), // User address -> count of recovery keys
    RecoveryKey(Address, u32), // User address, index -> recovery key
    Nonce(Address), // User address -> current nonce
}

// User passkey data
#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Passkey {
    pub user: Address,
    pub pubkey: BytesN<32>, // User's public key for signing
    pub metadata: Bytes, // CBOR or JSON metadata about the passkey
}

#[contract]
pub struct AuthContract;

#[contractimpl]
impl AuthContract {
    pub fn initialize(env: Env, owner: Address) -> Result<(), AuthError> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(AuthError::AlreadyInitialized);
        }
        owner.require_auth();
        
        env.storage().instance().set(&DataKey::Owner, &owner);
        
        env.events().publish(
            (symbol_short!("init"), symbol_short!("auth")), 
            owner.clone()
        );
        
        Ok(())
    }
    
    // Register a new passkey for a user
    pub fn register_passkey(
        env: Env,
        user: Address,
        pubkey: BytesN<32>,
        metadata: Bytes
    ) -> Result<(), AuthError> {
        // User must authenticate
        user.require_auth();
        
        // Create passkey
        let passkey = Passkey {
            user: user.clone(),
            pubkey,
            metadata,
        };
        
        // Store the passkey
        env.storage().instance().set(&DataKey::Passkey(user.clone()), &passkey);
        
        // Initialize nonce
        env.storage().instance().set(&DataKey::Nonce(user.clone()), &0u64);
        
        // Initialize recovery key count
        env.storage().instance().set(&DataKey::RecoveryKeyCount(user.clone()), &0u32);
        
        env.events().publish(
            (symbol_short!("register"), symbol_short!("passkey")), 
            user.clone()
        );
        
        Ok(())
    }
    
    pub fn get_passkey(env: Env, user: Address) -> Result<Passkey, AuthError> {
        let passkey = env.storage().instance().get::<DataKey, Passkey>(&DataKey::Passkey(user));
        if let Some(pk) = passkey {
            Ok(pk)
        } else {
            Err(AuthError::PasskeyNotFound)
        }
    }
    
    // Generate a challenge for authentication
    // Returns a nonce to be signed by the user
    pub fn generate_challenge(
        env: Env,
        user: Address,
        challenge_type: ChallengeType
    ) -> Result<u64, AuthError> {
        // Check if user exists
        if !env.storage().instance().has(&DataKey::Passkey(user.clone())) {
            return Err(AuthError::PasskeyNotFound);
        }
        
        // Get current nonce
        let current_nonce = match env.storage().instance().get::<DataKey, u64>(&DataKey::Nonce(user.clone())) {
            Some(nonce) => nonce,
            None => return Err(AuthError::NonceNotFound),
        };
        
        // Increment nonce
        let new_nonce = current_nonce + 1;
        env.storage().instance().set(&DataKey::Nonce(user.clone()), &new_nonce);
        
        // Publish challenge event
        env.events().publish(
            (symbol_short!("challenge"), symbol_short!("gen")),
            (user.clone(), challenge_type, new_nonce)
        );
        
        Ok(new_nonce)
    }
    
    // Add a recovery key to a user's account
    pub fn add_recovery_key(
        env: Env,
        user: Address,
        recovery_key_pk: BytesN<32>
    ) -> Result<u32, AuthError> {
        // User must authenticate
        user.require_auth();
        
        // Get current recovery key count
        let count = match env.storage().instance().get::<DataKey, u32>(&DataKey::RecoveryKeyCount(user.clone())) {
            Some(count) => count,
            None => 0,
        };
        
        // Maximum of 3 recovery keys
        if count >= 3 {
            return Err(AuthError::MaxRecoveryKeysReached);
        }
        
        // Store the new recovery key
        env.storage().instance().set(&DataKey::RecoveryKey(user.clone(), count), &recovery_key_pk);
        
        // Increment count
        env.storage().instance().set(&DataKey::RecoveryKeyCount(user.clone()), &(count + 1));
        
        env.events().publish(
            (symbol_short!("recovery"), symbol_short!("add")),
            (user.clone(), count)
        );
        
        Ok(count)
    }
    
    // Recover account by replacing the main passkey
    pub fn recover_account(
        env: Env,
        user: Address,
        recovery_key_pk_to_check: BytesN<32>,
        new_pubkey: BytesN<32>,
        metadata: Bytes
    ) -> Result<(), AuthError> {
        // Check if user exists
        if !env.storage().instance().has(&DataKey::Passkey(user.clone())) {
            return Err(AuthError::PasskeyNotFound);
        }
        
        // Get count of recovery keys
        let count = match env.storage().instance().get::<DataKey, u32>(&DataKey::RecoveryKeyCount(user.clone())) {
            Some(count) => count,
            None => 0,
        };
        
        // Check if provided recovery key matches any stored recovery key
        let mut key_found = false;
        for i in 0..count {
            if let Some(key) = env.storage().instance().get::<DataKey, BytesN<32>>(&DataKey::RecoveryKey(user.clone(), i)) {
                if key == recovery_key_pk_to_check {
                    key_found = true;
                    break;
                }
            }
        }
        
        if !key_found {
            return Err(AuthError::InvalidRecoveryKey);
        }
        
        // Create new passkey
        let passkey = Passkey {
            user: user.clone(),
            pubkey: new_pubkey,
            metadata,
        };
        
        // Store the new passkey
        env.storage().instance().set(&DataKey::Passkey(user.clone()), &passkey);
        
        // Reset nonce
        env.storage().instance().set(&DataKey::Nonce(user.clone()), &0u64);
        
        env.events().publish(
            (symbol_short!("recovery"), symbol_short!("done")),
            user.clone()
        );
        
        Ok(())
    }
    
    // Get owner of the contract
    fn get_owner_internal(env: &Env) -> Result<Address, AuthError> {
        let owner = env.storage().instance().get::<DataKey, Address>(&DataKey::Owner);
        if let Some(addr) = owner {
            Ok(addr)
        } else {
            Err(AuthError::NotInitialized)
        }
    }
}

/// Unit tests for the auth contract
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, AuthorizedFunction, Events, MockAuth, MockAuthInvoke};
    use soroban_sdk::{vec, BytesN, Env};
    use soroban_sdk::prng::SorobanPrng;

    // Helper to create Bytes for messages
    fn create_message_bytes(env: &Env, content: &str) -> Bytes {
        Bytes::from_slice(env, content.as_bytes())
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AuthContract);
        let owner = Address::generate(&env);
        
        // Authorize the call
        env.mock_all_auths();
        
        // Initialize the contract
        let client = AuthContractClient::new(&env, &contract_id);
        assert!(client.initialize(&owner).is_ok());
        
        // Verify event was published
        let events = env.events().all();
        assert_eq!(events.len(), 1);
        assert_eq!(
            events[0],
            (
                contract_id.clone(),
                (symbol_short!("init"), symbol_short!("auth")).into_val(&env),
                owner.into_val(&env)
            )
        );
    }
    
    #[test]
    fn test_register_passkey() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AuthContract);
        let owner = Address::generate(&env);
        let user = Address::generate(&env);
        
        // Create a dummy public key
        let public_key = BytesN::from_array(&env, &[0; 32]);
        
        // Authorize all calls
        env.mock_all_auths();
        
        // Initialize the contract
        let client = AuthContractClient::new(&env, &contract_id);
        client.initialize(&owner).unwrap();
        
        // Register a passkey
        client.register_passkey(&user, &public_key, &Bytes::new(&env)).unwrap();
        
        // Get the passkey
        let passkey = client.get_passkey(&user).unwrap();
        assert_eq!(passkey.pubkey, public_key);
    }

    #[test]
    fn test_generate_challenge() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AuthContract);
        let client = AuthContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        client.initialize(&owner).unwrap();
        
        let user = Address::generate(&env);
        client.register_passkey(&user, &BytesN::from_array(&env, &[0;32]), &Bytes::new(&env)).unwrap();

        let challenge_type = ChallengeType::Login;
        let result = client.generate_challenge(&user, &challenge_type);
        assert!(result.is_ok());

        let passkey_after = client.get_passkey(&user).unwrap();
        assert!(passkey_after.last_used_timestamp > 0);
    }

    #[test]
    fn test_add_recovery_key() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AuthContract);
        let client = AuthContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        client.initialize(&owner).unwrap();
        let user = Address::generate(&env);
        client.register_passkey(&user, &BytesN::from_array(&env, &[0;32]), &Bytes::new(&env)).unwrap();

        let result = client.add_recovery_key(&user, &BytesN::from_array(&env, &[1;32]));
        assert!(result.is_ok());

        let recovery_keys = client.get_recovery_keys(&user).unwrap();
        assert_eq!(recovery_keys.len(), 1);
        assert_eq!(recovery_keys.get_unchecked(0), BytesN::from_array(&env, &[1;32]));
    }

    #[test]
    fn test_recover_account() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AuthContract);
        let client = AuthContractClient::new(&env, &contract_id);

        let owner = Address::generate(&env);
        client.initialize(&owner).unwrap();
        let user = Address::generate(&env);
        let prng = SorobanPrng::new_from_seed(&[2;32]);
        let (pk_orig, _sk_orig) = prng.ed25519_keypair();
        client.register_passkey(&user, &pk_orig, &Bytes::new(&env)).unwrap();

        let (pk_rec, sk_rec) = prng.ed25519_keypair();
        client.add_recovery_key(&user, &pk_rec).unwrap();
        let recovery_keys = client.get_recovery_keys(&user).unwrap();
        assert_eq!(recovery_keys.len(), 1);
        assert_eq!(recovery_keys.get_unchecked(0), pk_rec);

        let (pk_new, _sk_new) = prng.ed25519_keypair();
        let message_for_recovery = create_message_bytes(&env, "recovery message");
        let recovery_sig = sk_rec.sign(&message_for_recovery).unwrap();

        client.recover_account(&user, &pk_rec, &pk_new, &message_for_recovery, &Bytes::new(&env)).unwrap();

        let new_passkey_obj = client.get_passkey(&user).unwrap();
        assert_eq!(new_passkey_obj.pubkey, pk_new);
        assert_eq!(client.get_nonce(&user).unwrap(), 0); // Nonce should be reset
    }
} 