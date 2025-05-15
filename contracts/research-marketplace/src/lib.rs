#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map, String, Symbol, Vec, Val, i128};

/// Research project metadata
#[derive(Clone)]
#[contracttype]
pub struct ResearchProject {
    id: BytesN<32>,
    name: String,
    description: String,
    researcher: Address,
    institution: String,
    data_categories: Vec<String>,
    min_reputation: u32,  // Minimum reputation score required (0-100)
    payment_per_contribution: i128,  // In stroops (0.0000001 XLM)
    total_budget: i128,  // Total budget for this project
    remaining_budget: i128,  // Remaining budget
    contribution_count: u32,  // Number of contributions received
    status: ProjectStatus,
    created_at: u64,
    expires_at: Option<u64>,
    ethically_approved: bool,
    approval_reference: String,
}

/// Project status
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum ProjectStatus {
    Draft,
    Active,
    Paused,
    Completed,
    Cancelled,
}

/// Data contribution
#[derive(Clone)]
#[contracttype]
pub struct DataContribution {
    id: BytesN<32>,
    project_id: BytesN<32>,
    contributor: Address,
    data_hash: BytesN<32>,
    categories: Vec<String>,
    quality_score: u32,  // 0-100
    payment_amount: i128,
    payment_claimed: bool,
    payment_tx_id: Option<String>,
    created_at: u64,
    approved: bool,
}

/// User profile
#[derive(Clone)]
#[contracttype]
pub struct UserProfile {
    address: Address,
    reputation_score: u32,  // 0-100
    total_contributions: u32,
    total_earned: i128,
    last_contribution: u64,
    categories: Map<String, u32>,  // Category -> contribution count
    created_at: u64,
}

/// Contract state
#[contract]
pub struct ResearchMarketplaceContract {
    owner: Address,
    projects: Map<BytesN<32>, ResearchProject>,
    contributions: Map<BytesN<32>, DataContribution>,
    user_contributions: Map<Address, Vec<BytesN<32>>>,
    project_contributions: Map<BytesN<32>, Vec<BytesN<32>>>,
    user_profiles: Map<Address, UserProfile>,
    admin_roles: Map<Address, bool>,
}

#[contractimpl]
impl ResearchMarketplaceContract {
    /// Initialize contract
    pub fn initialize(env: Env, owner: Address) -> Self {
        owner.require_auth();
        
        let mut admin_roles = Map::new(&env);
        admin_roles.set(owner.clone(), true);
        
        Self {
            owner,
            projects: Map::new(&env),
            contributions: Map::new(&env),
            user_contributions: Map::new(&env),
            project_contributions: Map::new(&env),
            user_profiles: Map::new(&env),
            admin_roles,
        }
    }
    
    /// Create a new research project
    pub fn create_project(
        env: Env,
        researcher: Address,
        name: String,
        description: String,
        institution: String,
        data_categories: Vec<String>,
        min_reputation: u32,
        payment_per_contribution: i128,
        total_budget: i128,
        expires_at: Option<u64>,
        ethically_approved: bool,
        approval_reference: String,
    ) -> BytesN<32> {
        // Verify researcher authorization
        researcher.require_auth();
        
        // Ensure sensible values
        if payment_per_contribution <= 0 {
            panic!("Payment per contribution must be positive");
        }
        
        if total_budget <= 0 {
            panic!("Total budget must be positive");
        }
        
        if min_reputation > 100 {
            panic!("Minimum reputation must be between 0 and 100");
        }
        
        // Create project ID
        let project_id = env.crypto().sha256(
            &String::from_str(&env, &format!("{}_{}", name.to_string(), env.ledger().timestamp()))
        );
        
        // Create project
        let project = ResearchProject {
            id: project_id.clone(),
            name,
            description,
            researcher,
            institution,
            data_categories,
            min_reputation,
            payment_per_contribution,
            total_budget,
            remaining_budget: total_budget,
            contribution_count: 0,
            status: ProjectStatus::Draft,
            created_at: env.ledger().timestamp(),
            expires_at,
            ethically_approved,
            approval_reference,
        };
        
        // Store project
        self.projects.set(project_id.clone(), project);
        
        // Initialize empty contribution list
        self.project_contributions.set(project_id.clone(), Vec::new(&env));
        
        project_id
    }
    
    /// Activate a project (make it available for contributions)
    pub fn activate_project(env: Env, researcher: Address, project_id: BytesN<32>) -> bool {
        // Verify researcher authorization
        researcher.require_auth();
        
        // Get project
        let mut project = match self.projects.get(project_id.clone()) {
            Some(p) => p,
            None => panic!("Project not found"),
        };
        
        // Check that user is the researcher
        if project.researcher != researcher {
            panic!("Only the researcher can activate this project");
        }
        
        // Check project is in draft status
        if project.status != ProjectStatus::Draft {
            panic!("Only draft projects can be activated");
        }
        
        // Ensure project has ethical approval
        if !project.ethically_approved {
            panic!("Project must have ethical approval");
        }
        
        // Update status
        project.status = ProjectStatus::Active;
        
        // Save project
        self.projects.set(project_id, project);
        
        true
    }
    
    /// Contribute data to a research project
    pub fn contribute_data(
        env: Env,
        contributor: Address,
        project_id: BytesN<32>,
        data_hash: BytesN<32>,
        categories: Vec<String>,
    ) -> BytesN<32> {
        // Verify contributor authorization
        contributor.require_auth();
        
        // Get project
        let mut project = match self.projects.get(project_id.clone()) {
            Some(p) => p,
            None => panic!("Project not found"),
        };
        
        // Check project is active
        if project.status != ProjectStatus::Active {
            panic!("Project is not active");
        }
        
        // Check if project has expired
        if let Some(expiry) = project.expires_at {
            if env.ledger().timestamp() > expiry {
                panic!("Project has expired");
            }
        }
        
        // Check project has sufficient budget
        if project.remaining_budget < project.payment_per_contribution {
            panic!("Project has insufficient budget");
        }
        
        // Get user profile or create new one
        let user_profile = self.get_or_create_user_profile(env.clone(), contributor.clone());
        
        // Check if user meets reputation requirements
        if user_profile.reputation_score < project.min_reputation {
            panic!("User does not meet minimum reputation requirement");
        }
        
        // Assess data quality (in a real implementation, this would involve more complex validation)
        // For this prototype, we'll use a simple scoring mechanism
        let quality_score = self.assess_data_quality(env.clone(), contributor.clone(), categories.clone());
        
        // Create contribution ID
        let contribution_id = env.crypto().sha256(
            &String::from_str(&env, &format!("{}_{}", data_hash.to_string(), env.ledger().timestamp()))
        );
        
        // Create contribution record
        let contribution = DataContribution {
            id: contribution_id.clone(),
            project_id: project_id.clone(),
            contributor: contributor.clone(),
            data_hash,
            categories,
            quality_score,
            payment_amount: project.payment_per_contribution,
            payment_claimed: false,
            payment_tx_id: None,
            created_at: env.ledger().timestamp(),
            approved: quality_score >= 70,  // Auto-approve if quality score is high enough
        };
        
        // Update project stats
        project.contribution_count += 1;
        project.remaining_budget -= project.payment_per_contribution;
        
        // Store contribution
        self.contributions.set(contribution_id.clone(), contribution);
        
        // Add to user's contributions
        let mut user_contributions = self.user_contributions.get(contributor.clone()).unwrap_or(Vec::new(&env));
        user_contributions.push_back(contribution_id.clone());
        self.user_contributions.set(contributor.clone(), user_contributions);
        
        // Add to project's contributions
        let mut project_contributions = self.project_contributions.get(project_id.clone()).unwrap_or(Vec::new(&env));
        project_contributions.push_back(contribution_id.clone());
        self.project_contributions.set(project_id.clone(), project_contributions);
        
        // Update project
        self.projects.set(project_id, project);
        
        // Update user profile
        self.update_user_profile_after_contribution(env, contributor);
        
        contribution_id
    }
    
    /// Claim payment for a contribution
    pub fn claim_payment(env: Env, contributor: Address, contribution_id: BytesN<32>) -> bool {
        // Verify contributor authorization
        contributor.require_auth();
        
        // Get contribution
        let mut contribution = match self.contributions.get(contribution_id.clone()) {
            Some(c) => c,
            None => panic!("Contribution not found"),
        };
        
        // Check that user is the contributor
        if contribution.contributor != contributor {
            panic!("Only the contributor can claim payment");
        }
        
        // Check that payment hasn't been claimed already
        if contribution.payment_claimed {
            panic!("Payment already claimed");
        }
        
        // Check that contribution is approved
        if !contribution.approved {
            panic!("Contribution not approved");
        }
        
        // In a real implementation, this would interact with Stellar to create a payment
        // For this prototype, we'll simulate a payment transaction
        
        let tx_id = format!(
            "TX{}_{}_{}", 
            env.ledger().sequence(), 
            contributor.to_string(),
            env.ledger().timestamp()
        );
        
        // Update contribution
        contribution.payment_claimed = true;
        contribution.payment_tx_id = Some(String::from_str(&env, &tx_id));
        
        // Store updated contribution
        self.contributions.set(contribution_id, contribution);
        
        // Update user profile stats
        self.update_user_earnings(env, contributor, contribution_id);
        
        true
    }
    
    /// Get or create user profile
    fn get_or_create_user_profile(&self, env: Env, user: Address) -> UserProfile {
        match self.user_profiles.get(user.clone()) {
            Some(profile) => profile,
            None => {
                // Create new profile
                let profile = UserProfile {
                    address: user.clone(),
                    reputation_score: 50,  // Start with a neutral score
                    total_contributions: 0,
                    total_earned: 0,
                    last_contribution: 0,
                    categories: Map::new(&env),
                    created_at: env.ledger().timestamp(),
                };
                
                // Store profile
                self.user_profiles.set(user, profile.clone());
                
                profile
            }
        }
    }
    
    /// Update user profile after contribution
    fn update_user_profile_after_contribution(&self, env: Env, user: Address) {
        // Get user profile
        let mut profile = self.user_profiles.get(user.clone()).unwrap();
        
        // Update stats
        profile.total_contributions += 1;
        profile.last_contribution = env.ledger().timestamp();
        
        // In a real implementation, we'd update the reputation based on the quality of contributions
        // Here we'll do a simple increment if they've made multiple contributions
        if profile.total_contributions > 5 && profile.reputation_score < 100 {
            profile.reputation_score += 1;
        }
        
        // Save profile
        self.user_profiles.set(user, profile);
    }
    
    /// Update user earnings
    fn update_user_earnings(&self, env: Env, user: Address, contribution_id: BytesN<32>) {
        // Get contribution
        let contribution = self.contributions.get(contribution_id).unwrap();
        
        // Get user profile
        let mut profile = self.user_profiles.get(user.clone()).unwrap();
        
        // Update earnings
        profile.total_earned += contribution.payment_amount;
        
        // Save profile
        self.user_profiles.set(user, profile);
    }
    
    /// Assess data quality
    fn assess_data_quality(&self, env: Env, user: Address, categories: Vec<String>) -> u32 {
        // Get user profile
        let profile = self.user_profiles.get(user.clone()).unwrap_or_else(|| {
            self.get_or_create_user_profile(env.clone(), user)
        });
        
        // In a real implementation, this would involve more complex validation
        // For this prototype, we'll use a simple scoring mechanism based on reputation and contribution history
        let base_score = profile.reputation_score;
        
        // If user has contributed to similar categories before, increase score
        let mut category_bonus = 0;
        for category in categories.iter() {
            if let Some(count) = profile.categories.get(category) {
                if count > 0 {
                    category_bonus += 5;
                }
            }
        }
        
        // Cap at 100
        let total_score = base_score + category_bonus;
        if total_score > 100 {
            100
        } else {
            total_score
        }
    }
    
    /// Get active research projects
    pub fn get_active_projects(env: Env) -> Vec<ResearchProject> {
        let mut active_projects = Vec::new(&env);
        
        for (_, project) in self.projects.iter() {
            if project.status == ProjectStatus::Active {
                // Check if project has expired
                if let Some(expiry) = project.expires_at {
                    if env.ledger().timestamp() <= expiry {
                        active_projects.push_back(project);
                    }
                } else {
                    active_projects.push_back(project);
                }
            }
        }
        
        active_projects
    }
    
    /// Get user contributions
    pub fn get_user_contributions(env: Env, user: Address) -> Vec<DataContribution> {
        let mut contributions_list = Vec::new(&env);
        
        // Get user contribution IDs
        if let Some(contribution_ids) = self.user_contributions.get(user) {
            for id in contribution_ids.iter() {
                if let Some(contribution) = self.contributions.get(id) {
                    contributions_list.push_back(contribution);
                }
            }
        }
        
        contributions_list
    }
    
    /// Get user profile
    pub fn get_user_profile(env: Env, user: Address) -> UserProfile {
        match self.user_profiles.get(user.clone()) {
            Some(profile) => profile,
            None => self.get_or_create_user_profile(env, user),
        }
    }
    
    /// Get project details
    pub fn get_project(env: Env, project_id: BytesN<32>) -> Option<ResearchProject> {
        self.projects.get(project_id)
    }
    
    /// Get project contributions
    pub fn get_project_contributions(env: Env, project_id: BytesN<32>) -> Vec<DataContribution> {
        let mut contributions_list = Vec::new(&env);
        
        // Get project contribution IDs
        if let Some(contribution_ids) = self.project_contributions.get(project_id) {
            for id in contribution_ids.iter() {
                if let Some(contribution) = self.contributions.get(id) {
                    contributions_list.push_back(contribution);
                }
            }
        }
        
        contributions_list
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
        let contract = ResearchMarketplaceContract::initialize(env.clone(), owner.clone());
        
        // Check that contract is initialized correctly
        assert_eq!(contract.owner, owner);
    }
} 