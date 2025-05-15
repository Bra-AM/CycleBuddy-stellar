#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec, BytesN};

#[derive(Clone)]
#[contracttype]
pub enum AchievementType {
    // Tracking achievements
    FirstEntry,
    ConsistentTracking7Days,
    ConsistentTracking30Days,
    ConsistentTracking90Days,
    
    // Educational achievements
    CompletedBasicCourse,
    CompletedAdvancedCourse,
    SharingKnowledge,
    
    // Community achievements
    JoinedCommunity,
    HelpedOthers,
    TopContributor,
}

#[derive(Clone)]
#[contracttype]
pub struct Achievement {
    id: u32,
    name: String,
    description: String,
    achievement_type: AchievementType,
    reward_amount: i128,
    required_progress: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct Progress {
    achievement_id: u32,
    current_value: u32,
    completed: bool,
    completed_at: Option<u64>,
}

#[derive(Clone)]
#[contracttype]
pub struct ClaimableReward {
    id: BytesN<32>,
    user: Address,
    achievement_id: u32,
    amount: i128,
    created_at: u64,
    claimed: bool,
    claimed_at: Option<u64>,
    // In a real implementation, this would store the Stellar claimable balance ID
    stellar_balance_id: Option<String>,
}

#[contract]
pub struct RewardContract {
    admin: Address,
    token_admin: Address,
    achievements: Map<u32, Achievement>,
    user_progress: Map<Address, Map<u32, Progress>>,
    claimable_rewards: Map<BytesN<32>, ClaimableReward>,
    user_rewards: Map<Address, Vec<BytesN<32>>>,
    next_achievement_id: u32,
}

#[contractimpl]
impl RewardContract {
    // Initialize the contract
    pub fn initialize(env: Env, admin: Address, token_admin: Address) -> Self {
        admin.require_auth();
        
        let mut contract = Self {
            admin,
            token_admin,
            achievements: Map::new(&env),
            user_progress: Map::new(&env),
            claimable_rewards: Map::new(&env),
            user_rewards: Map::new(&env),
            next_achievement_id: 1,
        };
        
        // Initialize with some default achievements
        contract.add_default_achievements(&env);
        
        contract
    }
    
    // Add default achievements
    fn add_default_achievements(&mut self, env: &Env) {
        // Tracking achievements
        self.create_achievement(
            env.clone(),
            self.admin.clone(),
            String::from_str(env, "First Entry"),
            String::from_str(env, "Record your first cycle entry"),
            AchievementType::FirstEntry,
            10,
            1,
        );
        
        self.create_achievement(
            env.clone(),
            self.admin.clone(),
            String::from_str(env, "Week Warrior"),
            String::from_str(env, "Track consistently for 7 days"),
            AchievementType::ConsistentTracking7Days,
            20,
            7,
        );
        
        self.create_achievement(
            env.clone(),
            self.admin.clone(),
            String::from_str(env, "Monthly Master"),
            String::from_str(env, "Track consistently for 30 days"),
            AchievementType::ConsistentTracking30Days,
            50,
            30,
        );
        
        // Educational achievements
        self.create_achievement(
            env.clone(),
            self.admin.clone(),
            String::from_str(env, "Knowledge Seeker"),
            String::from_str(env, "Complete the basic educational course"),
            AchievementType::CompletedBasicCourse,
            30,
            5,
        );
        
        // Community achievements
        self.create_achievement(
            env.clone(),
            self.admin.clone(),
            String::from_str(env, "Community Member"),
            String::from_str(env, "Join the CycleBuddy community"),
            AchievementType::JoinedCommunity,
            15,
            1,
        );
    }
    
    // Create a new achievement
    pub fn create_achievement(
        &mut self,
        env: Env,
        admin: Address,
        name: String,
        description: String,
        achievement_type: AchievementType,
        reward_amount: i128,
        required_progress: u32,
    ) -> u32 {
        admin.require_auth();
        
        if admin != self.admin {
            panic!("Only admin can create achievements");
        }
        
        let id = self.next_achievement_id;
        self.next_achievement_id += 1;
        
        let achievement = Achievement {
            id,
            name,
            description,
            achievement_type,
            reward_amount,
            required_progress,
        };
        
        self.achievements.set(id, achievement);
        
        id
    }
    
    // Update user's progress toward an achievement
    pub fn update_progress(
        env: Env,
        user: Address,
        achievement_id: u32,
        progress_value: u32,
    ) -> Result<(), String> {
        // In production, this would be called by an authorized data contract
        // For the prototype, we'll allow users to update their own progress
        user.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Check if achievement exists
        let achievement = contract.achievements.get(achievement_id)
            .ok_or(String::from_str(&env, "Achievement not found"))?;
        
        // Get or create user's achievement progress map
        let mut user_achievement_map = contract.user_progress.get(user.clone())
            .unwrap_or(Map::new(&env));
        
        // Get or create progress for this achievement
        let mut progress = user_achievement_map.get(achievement_id)
            .unwrap_or(Progress {
                achievement_id,
                current_value: 0,
                completed: false,
                completed_at: None,
            });
        
        // Update progress
        if !progress.completed {
            progress.current_value += progress_value;
            
            // Check if achievement is now completed
            if progress.current_value >= achievement.required_progress {
                progress.completed = true;
                progress.completed_at = Some(env.ledger().timestamp());
                
                // Create a claimable reward
                let _ = Self::create_claimable_reward(
                    env.clone(),
                    user.clone(),
                    achievement_id,
                );
            }
            
            // Update progress in storage
            let mut contract = contract;
            user_achievement_map.set(achievement_id, progress);
            contract.user_progress.set(user, user_achievement_map);
            Self::save_contract(&env, &contract);
        }
        
        Ok(())
    }
    
    // Create a claimable reward for a completed achievement
    fn create_claimable_reward(
        env: Env,
        user: Address,
        achievement_id: u32,
    ) -> Result<BytesN<32>, String> {
        let contract = Self::load_contract(&env);
        
        // Get the achievement
        let achievement = contract.achievements.get(achievement_id)
            .ok_or(String::from_str(&env, "Achievement not found"))?;
        
        // Create a unique reward ID
        let reward_id_preimage = env.crypto().sha256(
            &String::from_str(&env, &format!("{:?}_{}_{}",
                user, achievement_id, env.ledger().timestamp()))
        );
        
        // Create the claimable reward
        let reward = ClaimableReward {
            id: reward_id_preimage.clone(),
            user: user.clone(),
            achievement_id,
            amount: achievement.reward_amount,
            created_at: env.ledger().timestamp(),
            claimed: false,
            claimed_at: None,
            stellar_balance_id: None,
        };
        
        // In a real implementation, this would create a Stellar claimable balance
        // with the user as the claimant
        
        // Store the reward
        let mut contract = contract;
        contract.claimable_rewards.set(reward_id_preimage.clone(), reward);
        
        // Update user's rewards list
        let mut user_reward_ids = contract.user_rewards.get(user.clone())
            .unwrap_or(Vec::new(&env));
        user_reward_ids.push_back(reward_id_preimage.clone());
        contract.user_rewards.set(user, user_reward_ids);
        
        Self::save_contract(&env, &contract);
        
        Ok(reward_id_preimage)
    }
    
    // Check and create rewards for multiple achievements
    pub fn check_and_create_rewards(
        env: Env,
        user: Address,
    ) -> Vec<ClaimableReward> {
        user.require_auth();
        
        let contract = Self::load_contract(&env);
        let mut new_rewards = Vec::new(&env);
        
        // Get user's progress
        if let Some(user_achievement_map) = contract.user_progress.get(user.clone()) {
            // Check each achievement
            for (achievement_id, progress) in user_achievement_map.iter() {
                if progress.completed && !Self::has_claimed_reward(&env, &user, achievement_id) {
                    // Create a claimable reward
                    if let Ok(reward_id) = Self::create_claimable_reward(
                        env.clone(),
                        user.clone(),
                        achievement_id,
                    ) {
                        let contract = Self::load_contract(&env);
                        if let Some(reward) = contract.claimable_rewards.get(reward_id) {
                            new_rewards.push_back(reward);
                        }
                    }
                }
            }
        }
        
        new_rewards
    }
    
    // Check if user has already claimed a reward for an achievement
    fn has_claimed_reward(env: &Env, user: &Address, achievement_id: u32) -> bool {
        let contract = Self::load_contract(env);
        
        if let Some(reward_ids) = contract.user_rewards.get(user.clone()) {
            for reward_id in reward_ids.iter() {
                if let Some(reward) = contract.claimable_rewards.get(reward_id) {
                    if reward.achievement_id == achievement_id && reward.claimed {
                        return true;
                    }
                }
            }
        }
        
        false
    }
    
    // Claim a reward (in production, this would claim the Stellar claimable balance)
    pub fn claim_reward(
        env: Env,
        user: Address,
        reward_id: BytesN<32>,
    ) -> Result<(), String> {
        user.require_auth();
        
        let contract = Self::load_contract(&env);
        
        // Get the reward
        let mut reward = contract.claimable_rewards.get(reward_id.clone())
            .ok_or(String::from_str(&env, "Reward not found"))?;
        
        // Check if user is the reward owner
        if reward.user != user {
            return Err(String::from_str(&env, "Not your reward to claim"));
        }
        
        // Check if already claimed
        if reward.claimed {
            return Err(String::from_str(&env, "Reward already claimed"));
        }
        
        // In a real implementation, this would claim the Stellar claimable balance
        
        // Update reward status
        let mut contract = contract;
        reward.claimed = true;
        reward.claimed_at = Some(env.ledger().timestamp());
        contract.claimable_rewards.set(reward_id, reward);
        
        Self::save_contract(&env, &contract);
        
        Ok(())
    }
    
    // Get achievement details
    pub fn get_achievement(
        env: Env,
        achievement_id: u32,
    ) -> Option<Achievement> {
        let contract = Self::load_contract(&env);
        contract.achievements.get(achievement_id)
    }
    
    // Get all achievements
    pub fn list_achievements(
        env: Env,
    ) -> Vec<Achievement> {
        let contract = Self::load_contract(&env);
        let mut result = Vec::new(&env);
        
        for (_, achievement) in contract.achievements.iter() {
            result.push_back(achievement);
        }
        
        result
    }
    
    // Get user's progress for all achievements
    pub fn get_user_progress(
        env: Env,
        user: Address,
    ) -> Vec<Progress> {
        let contract = Self::load_contract(&env);
        let mut result = Vec::new(&env);
        
        if let Some(user_achievement_map) = contract.user_progress.get(user) {
            for (_, progress) in user_achievement_map.iter() {
                result.push_back(progress);
            }
        }
        
        result
    }
    
    // Get user's rewards
    pub fn get_user_rewards(
        env: Env,
        user: Address,
    ) -> Vec<ClaimableReward> {
        let contract = Self::load_contract(&env);
        let mut result = Vec::new(&env);
        
        if let Some(reward_ids) = contract.user_rewards.get(user) {
            for reward_id in reward_ids.iter() {
                if let Some(reward) = contract.claimable_rewards.get(reward_id) {
                    result.push_back(reward);
                }
            }
        }
        
        result
    }
    
    // Helper function to load contract state
    fn load_contract(env: &Env) -> RewardContract {
        // In a full implementation, we'd load from storage
        // For prototype, return empty contract
        RewardContract {
            admin: Address::from_string(env, "GBUKOFF6FX6767LKKOD3P7KAS43I3Z7CNUBPCH33YZKPPR53ZDHAHCER"),
            token_admin: Address::from_string(env, "GBUKOFF6FX6767LKKOD3P7KAS43I3Z7CNUBPCH33YZKPPR53ZDHAHCER"),
            achievements: Map::new(env),
            user_progress: Map::new(env),
            claimable_rewards: Map::new(env),
            user_rewards: Map::new(env),
            next_achievement_id: 1,
        }
    }
    
    // Helper function to save contract state
    fn save_contract(env: &Env, contract: &RewardContract) {
        // In a full implementation, we'd save to storage
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};
    
    #[test]
    fn test_reward_flow() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let user = Address::generate(&env);
        
        // Initialize contract
        let mut contract = RewardContract::initialize(env.clone(), admin.clone(), token_admin);
        
        // Get default achievements
        let achievements = RewardContract::list_achievements(env.clone());
        assert!(achievements.len() > 0);
        
        // Update progress for first achievement (First Entry)
        let first_entry_id = 1; // Assuming this is the ID of the FirstEntry achievement
        RewardContract::update_progress(
            env.clone(),
            user.clone(),
            first_entry_id,
            1, // Just need one entry
        ).unwrap();
        
        // Check user's progress
        let progress = RewardContract::get_user_progress(env.clone(), user.clone());
        assert_eq!(progress.len(), 1);
        assert_eq!(progress[0].achievement_id, first_entry_id);
        assert_eq!(progress[0].completed, true);
        
        // Check user's rewards
        let rewards = RewardContract::get_user_rewards(env.clone(), user.clone());
        assert_eq!(rewards.len(), 1);
        assert_eq!(rewards[0].achievement_id, first_entry_id);
        assert_eq!(rewards[0].claimed, false);
        
        // Claim the reward
        let reward_id = rewards[0].id.clone();
        RewardContract::claim_reward(
            env.clone(),
            user.clone(),
            reward_id,
        ).unwrap();
        
        // Check that reward is now claimed
        let updated_rewards = RewardContract::get_user_rewards(env.clone(), user.clone());
        assert_eq!(updated_rewards.len(), 1);
        assert_eq!(updated_rewards[0].claimed, true);
        
        // Try to claim again (should fail)
        let result = RewardContract::claim_reward(
            env.clone(),
            user.clone(),
            reward_id,
        );
        assert!(result.is_err());
    }
} 