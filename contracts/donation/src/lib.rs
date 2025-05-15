#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Symbol, Vec};

#[derive(Clone)]
#[contracttype]
pub struct Initiative {
    name: String,
    description: String,
    recipient: Address,
    preferred_asset: Asset,
    raised_amount: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct Donation {
    donor: Address,
    initiative_id: u32,
    from_asset: Asset,
    to_asset: Asset,
    amount: i128,
    converted_amount: i128,
    timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct Asset {
    code: String,
    issuer: Option<Address>,
}

#[contract]
pub struct DonationContract {
    initiatives: Map<u32, Initiative>,
    donations: Map<Address, Vec<Donation>>,
    total_donated: Map<u32, i128>,
    next_initiative_id: u32,
}

#[contractimpl]
impl DonationContract {
    // Initialize the contract
    pub fn initialize(env: Env, admin: Address) -> Self {
        admin.require_auth();
        
        Self {
            initiatives: Map::new(&env),
            donations: Map::new(&env),
            total_donated: Map::new(&env),
            next_initiative_id: 1,
        }
    }
    
    // Create a new health initiative
    pub fn create_initiative(
        env: Env,
        admin: Address,
        name: String,
        description: String,
        recipient: Address,
        preferred_asset: Asset,
    ) -> u32 {
        admin.require_auth();
        
        let contract = Self::load_contract(&env);
        let id = contract.next_initiative_id;
        let mut contract = contract;
        contract.next_initiative_id += 1;
        
        let initiative = Initiative {
            name,
            description,
            recipient,
            preferred_asset,
            raised_amount: 0,
        };
        
        contract.initiatives.set(id, initiative);
        contract.total_donated.set(id, 0);
        
        let env = env.clone();
        Self::save_contract(&env, &contract);
        
        id
    }
    
    // Donate to an initiative (in production this would call a path payment operation)
    pub fn donate_with_path_payment(
        env: Env,
        donor: Address,
        initiative_id: u32,
        from_asset: Asset,
        amount: i128,
    ) -> Result<(), String> {
        donor.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Check if initiative exists
        let initiative = contract.initiatives.get(initiative_id)
            .ok_or(String::from_str(&env, "Initiative not found"))?;
        
        // In a real implementation, this would:
        // 1. Create a path payment operation from from_asset to initiative.preferred_asset
        // 2. Route the payment through the Stellar DEX for best conversion rate
        
        // For prototype purposes, we're simulating the conversion
        // Assume a simple 1:1 conversion ratio for demo (would be based on actual DEX rates)
        let converted_amount = amount;
        
        // Record the donation
        let donation = Donation {
            donor: donor.clone(),
            initiative_id,
            from_asset,
            to_asset: initiative.preferred_asset.clone(),
            amount,
            converted_amount,
            timestamp: env.ledger().timestamp(),
        };
        
        // Update user's donation history
        let mut contract = contract;
        let mut user_donations = contract.donations.get(donor.clone()).unwrap_or(Vec::new(&env));
        user_donations.push_back(donation);
        contract.donations.set(donor, user_donations);
        
        // Update initiative's total raised amount
        let current_total = contract.total_donated.get(initiative_id).unwrap_or(0);
        contract.total_donated.set(initiative_id, current_total + converted_amount);
        
        // Update initiative raised amount
        let mut updated_initiative = initiative;
        updated_initiative.raised_amount += converted_amount;
        contract.initiatives.set(initiative_id, updated_initiative);
        
        let env = env.clone();
        Self::save_contract(&env, &contract);
        
        // In production, we would return the transaction hash for the path payment
        Ok(())
    }
    
    // Get donation history for a user
    pub fn get_donation_history(env: Env, user: Address) -> Vec<Donation> {
        let contract = Self::load_contract(&env);
        contract.donations.get(user).unwrap_or(Vec::new(&env))
    }
    
    // Get initiative details
    pub fn get_initiative(env: Env, initiative_id: u32) -> Option<Initiative> {
        let contract = Self::load_contract(&env);
        contract.initiatives.get(initiative_id)
    }
    
    // Get all initiatives
    pub fn list_initiatives(env: Env) -> Vec<(u32, Initiative)> {
        let contract = Self::load_contract(&env);
        let mut result = Vec::new(&env);
        
        for (id, initiative) in contract.initiatives.iter() {
            result.push_back((id, initiative));
        }
        
        result
    }
    
    // Get total donated to an initiative
    pub fn get_total_donated(env: Env, initiative_id: u32) -> i128 {
        let contract = Self::load_contract(&env);
        contract.total_donated.get(initiative_id).unwrap_or(0)
    }
    
    // Helper function to load contract state
    fn load_contract(env: &Env) -> DonationContract {
        let mut contract = DonationContract {
            initiatives: Map::new(env),
            donations: Map::new(env),
            total_donated: Map::new(env),
            next_initiative_id: 1,
        };
        
        // In a full implementation, we'd load from storage
        contract
    }
    
    // Helper function to save contract state
    fn save_contract(env: &Env, contract: &DonationContract) {
        // In a full implementation, we'd save to storage
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};
    
    #[test]
    fn test_donation_flow() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let donor = Address::generate(&env);
        let recipient = Address::generate(&env);
        
        // Initialize contract
        let mut contract = DonationContract::initialize(env.clone(), admin.clone());
        
        // Create a health initiative
        let preferred_asset = Asset {
            code: String::from_str(&env, "USDC"),
            issuer: Some(Address::generate(&env)),
        };
        
        let initiative_id = DonationContract::create_initiative(
            env.clone(),
            admin,
            String::from_str(&env, "Women's Health Research"),
            String::from_str(&env, "Funding research for women's health issues"),
            recipient,
            preferred_asset.clone(),
        );
        
        // Donor makes a donation
        let donation_asset = Asset {
            code: String::from_str(&env, "XLM"),
            issuer: None,
        };
        
        let amount = 100;
        
        DonationContract::donate_with_path_payment(
            env.clone(),
            donor.clone(),
            initiative_id,
            donation_asset,
            amount,
        ).unwrap();
        
        // Check donation history
        let history = DonationContract::get_donation_history(env.clone(), donor);
        assert_eq!(history.len(), 1);
        
        // Check initiative raised amount
        let initiative = DonationContract::get_initiative(env.clone(), initiative_id).unwrap();
        assert_eq!(initiative.raised_amount, amount);
        
        // Check total donated
        let total = DonationContract::get_total_donated(env.clone(), initiative_id);
        assert_eq!(total, amount);
    }
} 