#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map, String, Symbol, Vec};

/// Educational module metadata
#[derive(Clone)]
#[contracttype]
pub struct EducationalModule {
    id: BytesN<32>,
    title: String,
    description: String,
    level: u32,  // Difficulty level (1-5)
    topics: Vec<String>,
    prereq_modules: Vec<BytesN<32>>,
    completion_criteria: CompletionCriteria,
    nft_metadata: NFTMetadata,
    created_at: u64,
    active: bool,
}

/// Module completion criteria
#[derive(Clone)]
#[contracttype]
pub enum CompletionCriteria {
    Quiz { pass_threshold: u32 },  // Percentage needed to pass
    TaskCompletion { tasks_required: u32 },
    TimeBased { minutes_required: u32 },
    Combined { criteria: Vec<CompletionCriteria> },
}

/// NFT metadata
#[derive(Clone)]
#[contracttype]
pub struct NFTMetadata {
    name: String,
    description: String,
    image_url: String,
    level: u32,
    topics: Vec<String>,
    issuer: String,
    verification_url: String,
}

/// User progress tracking
#[derive(Clone)]
#[contracttype]
pub struct UserProgress {
    user: Address,
    module_id: BytesN<32>,
    status: ProgressStatus,
    score: u32,  // 0-100
    completed_tasks: u32,
    time_spent: u32,  // In minutes
    attempts: u32,
    started_at: u64,
    completed_at: Option<u64>,
    nft_issued: bool,
    nft_asset: Option<String>,
}

/// Progress status
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum ProgressStatus {
    NotStarted,
    InProgress,
    Completed,
    Failed,
}

/// Partner organization details
#[derive(Clone)]
#[contracttype]
pub struct Partner {
    id: BytesN<32>,
    name: String,
    description: String,
    website: String,
    recognized_modules: Vec<BytesN<32>>,
    active: bool,
}

/// Partner benefit
#[derive(Clone)]
#[contracttype]
pub struct PartnerBenefit {
    id: BytesN<32>,
    partner_id: BytesN<32>,
    title: String,
    description: String,
    required_modules: Vec<BytesN<32>>,
    benefit_type: BenefitType,
    valid_from: u64,
    valid_until: Option<u64>,
    active: bool,
}

/// Benefit type
#[derive(Clone)]
#[contracttype]
pub enum BenefitType {
    Discount { percentage: u32 },
    Service { service_name: String },
    Access { resource: String },
    Custom { details: String },
}

/// Contract state
#[contract]
pub struct NFTEducationContract {
    owner: Address,
    admin_roles: Map<Address, bool>,
    modules: Map<BytesN<32>, EducationalModule>,
    user_progress: Map<Address, Map<BytesN<32>, UserProgress>>,
    user_nfts: Map<Address, Vec<String>>,
    partners: Map<BytesN<32>, Partner>,
    partner_benefits: Map<BytesN<32>, PartnerBenefit>,
    mentor_status: Map<Address, bool>, // Users who can mentor others
}

#[contractimpl]
impl NFTEducationContract {
    /// Initialize contract
    pub fn initialize(env: Env, owner: Address) -> Self {
        owner.require_auth();
        
        let mut admin_roles = Map::new(&env);
        admin_roles.set(owner.clone(), true);
        
        Self {
            owner,
            admin_roles,
            modules: Map::new(&env),
            user_progress: Map::new(&env),
            user_nfts: Map::new(&env),
            partners: Map::new(&env),
            partner_benefits: Map::new(&env),
            mentor_status: Map::new(&env),
        }
    }
    
    /// Create a new educational module
    pub fn create_module(
        env: Env,
        admin: Address,
        title: String,
        description: String,
        level: u32,
        topics: Vec<String>,
        prereq_modules: Vec<BytesN<32>>,
        completion_criteria: CompletionCriteria,
        nft_metadata: NFTMetadata,
    ) -> BytesN<32> {
        // Verify admin authorization
        admin.require_auth();
        if !self.is_admin(admin) {
            panic!("Not authorized to create modules");
        }
        
        // Check level is valid (1-5)
        if level < 1 || level > 5 {
            panic!("Invalid level: must be 1-5");
        }
        
        // Create module ID
        let module_id = env.crypto().sha256(
            &String::from_str(&env, &format!("{}_{}", title.to_string(), env.ledger().timestamp()))
        );
        
        // Create module
        let module = EducationalModule {
            id: module_id.clone(),
            title,
            description,
            level,
            topics,
            prereq_modules,
            completion_criteria,
            nft_metadata,
            created_at: env.ledger().timestamp(),
            active: true,
        };
        
        // Store module
        self.modules.set(module_id.clone(), module);
        
        module_id
    }
    
    /// Start a module (user enrolls)
    pub fn start_module(env: Env, user: Address, module_id: BytesN<32>) -> bool {
        // Verify user authorization
        user.require_auth();
        
        // Check if module exists
        let module = match self.modules.get(module_id.clone()) {
            Some(m) => m,
            None => panic!("Module not found"),
        };
        
        // Get user progress map for all modules
        let mut user_modules = self.user_progress.get(user.clone()).unwrap_or(Map::new(&env));
        
        // Check if user has already started this module
        if let Some(progress) = user_modules.get(module_id.clone()) {
            if progress.status != ProgressStatus::Failed {
                panic!("Module already started");
            }
        }
        
        // Check prerequisites
        for prereq_id in module.prereq_modules.iter() {
            let prereq_completed = match user_modules.get(prereq_id) {
                Some(progress) => progress.status == ProgressStatus::Completed,
                None => false,
            };
            
            if !prereq_completed {
                panic!("Prerequisites not completed");
            }
        }
        
        // Create progress entry
        let progress = UserProgress {
            user: user.clone(),
            module_id: module_id.clone(),
            status: ProgressStatus::InProgress,
            score: 0,
            completed_tasks: 0,
            time_spent: 0,
            attempts: 1,
            started_at: env.ledger().timestamp(),
            completed_at: None,
            nft_issued: false,
            nft_asset: None,
        };
        
        // Store progress
        user_modules.set(module_id, progress);
        self.user_progress.set(user, user_modules);
        
        true
    }
    
    /// Update module progress
    pub fn update_progress(
        env: Env,
        user: Address,
        module_id: BytesN<32>,
        score: Option<u32>,
        completed_tasks: Option<u32>,
        time_spent: Option<u32>,
    ) -> bool {
        // Verify user authorization
        user.require_auth();
        
        // Get user progress
        let mut user_modules = match self.user_progress.get(user.clone()) {
            Some(modules) => modules,
            None => panic!("No modules in progress"),
        };
        
        // Get specific module progress
        let mut progress = match user_modules.get(module_id.clone()) {
            Some(p) => p,
            None => panic!("Module not started"),
        };
        
        // Update progress fields if provided
        if let Some(s) = score {
            progress.score = s;
        }
        
        if let Some(tasks) = completed_tasks {
            progress.completed_tasks = tasks;
        }
        
        if let Some(time) = time_spent {
            progress.time_spent = time;
        }
        
        // Store updated progress
        user_modules.set(module_id, progress);
        self.user_progress.set(user, user_modules);
        
        true
    }
    
    /// Complete a module and issue NFT
    pub fn complete_module(env: Env, user: Address, module_id: BytesN<32>) -> String {
        // Verify user authorization
        user.require_auth();
        
        // Get user modules
        let mut user_modules = match self.user_progress.get(user.clone()) {
            Some(modules) => modules,
            None => panic!("No modules in progress"),
        };
        
        // Get specific module progress
        let mut progress = match user_modules.get(module_id.clone()) {
            Some(p) => p,
            None => panic!("Module not started"),
        };
        
        // Get module details
        let module = match self.modules.get(module_id.clone()) {
            Some(m) => m,
            None => panic!("Module not found"),
        };
        
        // Check if already completed
        if progress.status == ProgressStatus::Completed {
            panic!("Module already completed");
        }
        
        // Verify completion criteria
        match &module.completion_criteria {
            CompletionCriteria::Quiz { pass_threshold } => {
                if progress.score < *pass_threshold {
                    panic!("Quiz score below threshold");
                }
            },
            CompletionCriteria::TaskCompletion { tasks_required } => {
                if progress.completed_tasks < *tasks_required {
                    panic!("Not enough tasks completed");
                }
            },
            CompletionCriteria::TimeBased { minutes_required } => {
                if progress.time_spent < *minutes_required {
                    panic!("Not enough time spent");
                }
            },
            CompletionCriteria::Combined { criteria } => {
                // For combined criteria, we'd need more complex logic
                // Simplified for this example
                panic!("Combined criteria not implemented in this example");
            }
        }
        
        // Mark as completed
        progress.status = ProgressStatus::Completed;
        progress.completed_at = Some(env.ledger().timestamp());
        
        // Issue NFT
        // In a real implementation, this would interact with Stellar to create an actual NFT
        // For this prototype, we'll generate a simulated NFT asset ID
        
        let nft_asset_id = format!(
            "NFT-{}-{}", 
            env.ledger().sequence(), 
            String::from_str(&env, &format!("{}-{}", module.title.to_string(), user.to_string()))
        );
        
        progress.nft_issued = true;
        progress.nft_asset = Some(String::from_str(&env, &nft_asset_id));
        
        // Update user progress
        user_modules.set(module_id.clone(), progress);
        self.user_progress.set(user.clone(), user_modules);
        
        // Add NFT to user's collection
        let mut user_nft_list = self.user_nfts.get(user.clone()).unwrap_or(Vec::new(&env));
        user_nft_list.push_back(String::from_str(&env, &nft_asset_id));
        self.user_nfts.set(user, user_nft_list);
        
        // Check if user qualifies for mentor status (achieved level 5 in any module)
        if module.level == 5 {
            self.mentor_status.set(user, true);
        }
        
        nft_asset_id
    }
    
    /// Register partner organization
    pub fn register_partner(
        env: Env,
        admin: Address,
        name: String,
        description: String,
        website: String,
    ) -> BytesN<32> {
        // Verify admin authorization
        admin.require_auth();
        if !self.is_admin(admin) {
            panic!("Not authorized to register partners");
        }
        
        // Create partner ID
        let partner_id = env.crypto().sha256(
            &String::from_str(&env, &format!("{}_{}", name.to_string(), env.ledger().timestamp()))
        );
        
        // Create partner
        let partner = Partner {
            id: partner_id.clone(),
            name,
            description,
            website,
            recognized_modules: Vec::new(&env),
            active: true,
        };
        
        // Store partner
        self.partners.set(partner_id.clone(), partner);
        
        partner_id
    }
    
    /// Add partner benefit
    pub fn add_partner_benefit(
        env: Env,
        admin: Address,
        partner_id: BytesN<32>,
        title: String,
        description: String,
        required_modules: Vec<BytesN<32>>,
        benefit_type: BenefitType,
        valid_from: u64,
        valid_until: Option<u64>,
    ) -> BytesN<32> {
        // Verify admin authorization
        admin.require_auth();
        if !self.is_admin(admin) {
            panic!("Not authorized to add partner benefits");
        }
        
        // Check if partner exists
        if !self.partners.contains_key(partner_id.clone()) {
            panic!("Partner not found");
        }
        
        // Create benefit ID
        let benefit_id = env.crypto().sha256(
            &String::from_str(&env, &format!("{}_{}", title.to_string(), env.ledger().timestamp()))
        );
        
        // Create benefit
        let benefit = PartnerBenefit {
            id: benefit_id.clone(),
            partner_id,
            title,
            description,
            required_modules,
            benefit_type,
            valid_from,
            valid_until,
            active: true,
        };
        
        // Store benefit
        self.partner_benefits.set(benefit_id.clone(), benefit);
        
        benefit_id
    }
    
    /// Check if user qualifies for a benefit
    pub fn check_benefit_eligibility(
        env: Env,
        user: Address,
        benefit_id: BytesN<32>,
    ) -> bool {
        // Get benefit details
        let benefit = match self.partner_benefits.get(benefit_id) {
            Some(b) => b,
            None => panic!("Benefit not found"),
        };
        
        // Check if benefit is active
        if !benefit.active {
            return false;
        }
        
        // Check if benefit is within valid period
        let current_time = env.ledger().timestamp();
        if current_time < benefit.valid_from {
            return false;
        }
        
        if let Some(end_time) = benefit.valid_until {
            if current_time > end_time {
                return false;
            }
        }
        
        // Get user modules
        let user_modules = match self.user_progress.get(user.clone()) {
            Some(modules) => modules,
            None => return false,
        };
        
        // Check if user has completed all required modules
        for module_id in benefit.required_modules.iter() {
            match user_modules.get(module_id) {
                Some(progress) => {
                    if progress.status != ProgressStatus::Completed || !progress.nft_issued {
                        return false;
                    }
                },
                None => return false,
            }
        }
        
        true
    }
    
    /// Verify NFT ownership (callable by partners)
    pub fn verify_nft_ownership(
        env: Env,
        user: Address,
        asset_id: String,
    ) -> bool {
        // Get user's NFTs
        let user_nfts = match self.user_nfts.get(user) {
            Some(nfts) => nfts,
            None => return false,
        };
        
        // Check if user owns this NFT
        for nft in user_nfts.iter() {
            if nft == asset_id {
                return true;
            }
        }
        
        false
    }
    
    /// Get user completed modules
    pub fn get_user_completed_modules(env: Env, user: Address) -> Vec<BytesN<32>> {
        // Get user modules
        let user_modules = match self.user_progress.get(user) {
            Some(modules) => modules,
            None => return Vec::new(&env),
        };
        
        let mut completed = Vec::new(&env);
        
        // Find completed modules
        for (module_id, progress) in user_modules.iter() {
            if progress.status == ProgressStatus::Completed {
                completed.push_back(module_id);
            }
        }
        
        completed
    }
    
    /// Check if address has admin role
    fn is_admin(&self, address: Address) -> bool {
        match self.admin_roles.get(address) {
            Some(is_admin) => is_admin,
            None => false,
        }
    }
    
    /// Add an admin
    pub fn add_admin(env: Env, owner: Address, new_admin: Address) -> bool {
        // Only owner can add admins
        owner.require_auth();
        if owner != self.owner {
            panic!("Only owner can add admins");
        }
        
        self.admin_roles.set(new_admin, true);
        true
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let owner = Address::random(&env);
        let contract = NFTEducationContract::initialize(env.clone(), owner.clone());
        
        // Check that contract is initialized correctly
        assert_eq!(contract.owner, owner);
        assert!(contract.admin_roles.get(owner).unwrap());
    }
} 